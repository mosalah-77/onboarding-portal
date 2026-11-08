import { PortalError } from './brief.ts';
import { checkCsrf, requireActor, sessionView, startDemo, type Persona } from './session.ts';
import { getProject, saveRevision, submitBrief, createRequest, commentOnRequest, resolveRequest, approveBrief, reopenBrief } from './workflow.ts';
import { uploadAsset, downloadAsset } from './assets.ts';
import { cleanupExpiredRuns, requireOperator } from './cleanup.ts';
export type PortalEnv = { DB: D1Database; BUCKET: R2Bucket; DEMO_ADMIN_TOKEN?: string };

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new PortalError(415, 'Send this action as JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new PortalError(422, 'Missing request data.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); throw new PortalError(413, 'This request is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
    return body;
  } catch { throw new PortalError(422, 'The request could not be read. Check the values and retry.'); }
}
export async function handlePortalRequest(request: Request, env: PortalEnv): Promise<Response> {
  try {
    const path = new URL(request.url).pathname.slice('/api/portal'.length).split('/').filter(Boolean);
    if (request.method === 'POST' && path.join('/') === 'admin/cleanup') {
      await requireOperator(request, env); const body = await jsonBody(request);
      return Response.json(await cleanupExpiredRuns(env, body.limit as number), { headers: { 'Cache-Control': 'no-store' } });
    }
    if (request.method === 'POST' && path.join('/') === 'demo') {
      let existing;
      try { existing = await requireActor(request, env.DB); } catch (error) { if (!(error instanceof PortalError) || error.status !== 401) throw error; }
      if (existing) checkCsrf(request, existing);
      await jsonBody(request); return await startDemo(env.DB, request);
    }
    const actor = await requireActor(request, env.DB);
    if (request.method === 'POST') checkCsrf(request, actor);
    if (request.method === 'POST' && path.join('/') === 'demo/reset') { await jsonBody(request); return await startDemo(env.DB, request, actor); }
    if (request.method === 'GET' && path.length === 2 && path[0] === 'assets') return await downloadAsset(env, actor, path[1]);
    let result: unknown;
    if (request.method === 'GET' && path.join('/') === 'session') result = await sessionView(env.DB, actor);
    else if (request.method === 'POST' && path.join('/') === 'persona') {
      const body = await jsonBody(request);
      if (!['client-a', 'client-b', 'owner'].includes(body.persona as string)) throw new PortalError(422, 'Choose one of this demo’s personas.');
      await env.DB.prepare('UPDATE sessions SET persona=? WHERE id=? AND run_id=?').bind(body.persona, actor.sessionId, actor.runId).run();
      result = await sessionView(env.DB, { ...actor, personaId: body.persona as Persona, role: body.persona === 'owner' ? 'owner' : 'client' });
    } else if (request.method === 'POST' && path.length === 3 && path[0] === 'projects' && path[2] === 'assets') {
      if (!request.body) throw new PortalError(422, 'Choose a file to upload.');
      let filename: string;
      try { filename = decodeURIComponent(request.headers.get('x-file-name') ?? ''); }
      catch { throw new PortalError(422, 'The filename could not be read.'); }
      result = await uploadAsset(env, actor, path[1], request.headers.get('x-operation-key'), filename, request.headers.get('content-type') ?? '', request.body);
    } else if (request.method === 'GET' && path.length === 2 && path[0] === 'projects') result = await getProject(env.DB, actor, path[1]);
    else if (request.method === 'POST' && path.length === 3 && path[0] === 'projects') {
      const b = await jsonBody(request);
      if (path[2] === 'revisions') result = await saveRevision(env.DB, actor, path[1], b.expectedToken, b.key, b.brief);
      else if (path[2] === 'submit') result = await submitBrief(env.DB, actor, path[1], b.revisionId, b.expectedToken, b.key);
      else if (path[2] === 'requests') result = await createRequest(env.DB, actor, path[1], b, b.expectedToken, b.key);
      else if (path[2] === 'approve') result = await approveBrief(env.DB, actor, path[1], b.revisionId, b.expectedToken, b.key);
      else if (path[2] === 'reopen') result = await reopenBrief(env.DB, actor, path[1], b.reason, b.expectedToken, b.key);
      else throw new PortalError(404, 'This action is unavailable.');
    } else if (request.method === 'POST' && path.length === 3 && path[0] === 'requests') {
      const b = await jsonBody(request);
      if (path[2] === 'comments') result = await commentOnRequest(env.DB, actor, path[1], b.text, b.key);
      else if (path[2] === 'resolve') result = await resolveRequest(env.DB, actor, path[1], b.explanation, b.expectedToken, b.key);
      else throw new PortalError(404, 'This action is unavailable.');
    } else throw new PortalError(404, 'This item is unavailable.');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    if (error instanceof PortalError) return Response.json({ error: error.message, details: error.details }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
    console.error('Portal operation failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The change could not be completed. Your input is still here; retry shortly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
