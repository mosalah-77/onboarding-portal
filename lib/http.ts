import { PortalError } from './brief.ts';
import { checkCsrf, requireActor, sessionView, startDemo, type Persona } from './session.ts';
import { getProject, saveRevision } from './workflow.ts';
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
    if (request.method === 'POST' && path.join('/') === 'demo') { await jsonBody(request); return await startDemo(env.DB, request); }
    const actor = await requireActor(request, env.DB);
    if (request.method === 'POST') checkCsrf(request, actor);
    let result: unknown;
    if (request.method === 'GET' && path.join('/') === 'session') result = await sessionView(env.DB, actor);
    else if (request.method === 'POST' && path.join('/') === 'persona') {
      const body = await jsonBody(request);
      if (!['client-a', 'client-b', 'owner'].includes(body.persona as string)) throw new PortalError(422, 'Choose one of this demo’s personas.');
      await env.DB.prepare('UPDATE sessions SET persona=? WHERE id=? AND run_id=?').bind(body.persona, actor.sessionId, actor.runId).run();
      result = await sessionView(env.DB, { ...actor, personaId: body.persona as Persona, role: body.persona === 'owner' ? 'owner' : 'client' });
    } else if (request.method === 'GET' && path.length === 2 && path[0] === 'projects') result = await getProject(env.DB, actor, path[1]);
    else if (request.method === 'POST' && path.length === 3 && path[0] === 'projects' && path[2] === 'revisions') {
      const b = await jsonBody(request); result = await saveRevision(env.DB, actor, path[1], b.expectedToken, b.key, b.brief);
    } else throw new PortalError(404, 'This item is unavailable.');
    return Response.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    if (error instanceof PortalError) return Response.json({ error: error.message, details: error.details }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
    console.error('Portal operation failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The change could not be completed. Your input is still here; retry shortly.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
