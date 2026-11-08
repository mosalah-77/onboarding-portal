import { PortalError, textValue } from './brief.ts';
import { digest, id, type ActorContext } from './session.ts';
import { projectRow, type AssetView } from './workflow.ts';
import type { PortalEnv } from './http.ts';
import type { assets } from '../db/schema';
type AssetRow = typeof assets.$inferSelect;
const MiB = 1024 * 1024;

async function readFile(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 2 * MiB) { await reader.cancel(); throw new PortalError(413, 'Choose a file no larger than 2 MiB.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
function validateFile(name: string, type: string, bytes: Uint8Array) {
  if (/[\x00-\x1f\x7f/\\]/.test(name)) throw new PortalError(422, 'Use a filename without slashes or control characters.');
  const prefix = Array.from(bytes.subarray(0, 8)).join(','), text = new TextDecoder().decode(bytes.subarray(0, 8));
  const valid = (type === 'image/png' && /\.png$/i.test(name) && bytes.length >= 33 && prefix === '137,80,78,71,13,10,26,10' && new TextDecoder().decode(bytes.subarray(12, 16)) === 'IHDR')
    || (type === 'image/jpeg' && /\.jpe?g$/i.test(name) && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217)
    || (type === 'application/pdf' && /\.pdf$/i.test(name) && /^%PDF-[12]\./.test(text) && new TextDecoder().decode(bytes.subarray(-1024)).includes('%%EOF'));
  if (!valid) throw new PortalError(422, 'Choose a PNG, JPEG or PDF whose contents match its filename and type.');
}
const view = (a: AssetRow): AssetView => ({ id: a.id, name: a.name, contentType: a.content_type, size: a.size, status: a.status });

export async function uploadAsset(env: PortalEnv, actor: ActorContext, projectId: string, operationKey: unknown, filename: unknown, contentType: string, body: ReadableStream<Uint8Array>): Promise<AssetView> {
  const p = await projectRow(env.DB, actor, projectId);
  const key = textValue(operationKey, 'Upload retry key', 100, true), name = textValue(filename, 'Filename', 120, true);
  const bytes = await readFile(body); validateFile(name, contentType, bytes);
  const hash = await digest(bytes), db = env.DB;
  const prior = () => db.prepare('SELECT * FROM assets WHERE project_id=? AND operation_key=?').bind(projectId, key).first<AssetRow>();
  let asset = await prior();
  if (!asset) {
    if (p.state === 'approved') throw new PortalError(409, 'Reopen the approved brief before adding files.');
    const assetId = id(), now = Date.now();
    try {
      await db.prepare(`INSERT INTO assets (id,run_id,project_id,operation_key,storage_key,digest,name,content_type,size,status,actor,created_at)
        SELECT ?,?,?,?,?,?,?,?,?,'pending',?,? WHERE
        EXISTS(SELECT 1 FROM sessions s JOIN runs r ON r.id=s.run_id WHERE s.id=? AND s.persona=? AND r.id=? AND r.expires_at>?)
        AND (SELECT COUNT(*) FROM assets WHERE project_id=?)<5
        AND COALESCE((SELECT SUM(size) FROM assets WHERE run_id=?),0)+?<=?
        AND COALESCE((SELECT SUM(size) FROM assets),0)+?<=?`).bind(assetId, actor.runId, projectId, key, `${actor.runId}/${projectId}/${assetId}`, hash, name, contentType, bytes.byteLength, actor.personaId, now,
        actor.sessionId, actor.personaId, actor.runId, now, projectId, actor.runId, bytes.byteLength, 20 * MiB, bytes.byteLength, 200 * MiB).run();
    } catch (error) { if (!await prior()) throw error; }
    asset = await prior();
    if (!asset) throw new PortalError(429, 'Upload capacity reached or the demo changed. Retry an unfinished upload or start a new demo.');
  }
  if (asset.digest !== hash || asset.name !== name || asset.content_type !== contentType) throw new PortalError(409, 'This retry key belongs to a different file.');
  if (asset.status === 'ready') return view(asset);
  const writeId = id();
  const claim = await db.prepare(`INSERT INTO asset_writes (id,run_id,asset_id,created_at)
    SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM runs r JOIN sessions s ON s.run_id=r.id
      WHERE r.id=? AND r.expires_at>? AND s.id=? AND s.persona=?)`).bind(writeId, actor.runId, asset.id, Date.now(), actor.runId, Date.now(), actor.sessionId, actor.personaId).run();
  if (!claim.meta.changes) throw new PortalError(409, 'The demo changed or expired during this upload. Reload before retrying.');
  // A durable write claim keeps cleanup away until even a failed storage call has settled.
  try {
  const stored = await env.BUCKET.put(asset.storage_key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, customMetadata: { sha256: hash }, httpMetadata: { contentType } });
  if (!stored && (await env.BUCKET.head(asset.storage_key))?.customMetadata?.sha256 !== hash) throw new PortalError(503, 'The stored upload could not be verified. Please retry.');
  const pending = `EXISTS(SELECT 1 FROM assets a JOIN runs r ON r.id=a.run_id WHERE a.id=? AND a.status='pending' AND r.expires_at>?)`;
  const now = Date.now();
  await db.batch([
    db.prepare(`INSERT INTO events (id,project_id,actor,action,details,created_at) SELECT ?,?,?,'asset_uploaded',?,? WHERE ${pending}`).bind(id(), projectId, actor.personaId, JSON.stringify({ assetId: asset.id, name }), now, asset.id, now),
    db.prepare(`UPDATE projects SET token=token+1 WHERE id=? AND ${pending}`).bind(projectId, asset.id, now),
    db.prepare(`UPDATE assets SET status='ready' WHERE id=? AND ${pending}`).bind(asset.id, asset.id, now),
  ]);
  const ready = await prior();
  if (ready?.status !== 'ready') throw new PortalError(409, 'The demo expired during this upload. Start a new demo.');
  return view(ready);
  } finally {
    // shortcut: abrupt Worker termination can leave a claim; inspect it during operator maintenance rather than time it out unsafely.
    await db.prepare('DELETE FROM asset_writes WHERE id=?').bind(writeId).run();
  }
}

export async function downloadAsset(env: PortalEnv, actor: ActorContext, assetId: string): Promise<Response> {
  const asset = await env.DB.prepare(`SELECT a.* FROM assets a JOIN projects p ON p.id=a.project_id JOIN memberships m ON m.workspace_id=p.workspace_id
    WHERE a.id=? AND a.status='ready' AND m.run_id=? AND m.persona=?`).bind(assetId, actor.runId, actor.personaId).first<AssetRow>();
  if (!asset) throw new PortalError(404, 'This file is unavailable.');
  const object = await env.BUCKET.get(asset.storage_key);
  if (!object) throw new PortalError(503, 'This file could not be loaded. The brief is still saved; retry shortly.');
  return new Response(object.body, { headers: {
    'Content-Type': asset.content_type, 'Content-Length': String(asset.size),
    'Content-Disposition': `attachment; filename="download.${asset.name.split('.').at(-1)}"; filename*=UTF-8''${encodeURIComponent(asset.name).replace(/'/g, '%27')}`,
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
  } });
}
