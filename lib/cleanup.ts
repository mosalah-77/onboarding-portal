import { timingSafeEqual } from 'node:crypto';
import { PortalError } from './brief.ts';
import { digest } from './session.ts';
import type { PortalEnv } from './http.ts';

export async function requireOperator(request: Request, env: PortalEnv) {
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!env.DEMO_ADMIN_TOKEN || !supplied || supplied.length > 512) throw new PortalError(401, 'Operator credentials required.');
  const encoder = new TextEncoder();
  if (!timingSafeEqual(encoder.encode(await digest(supplied)), encoder.encode(await digest(env.DEMO_ADMIN_TOKEN))))
    throw new PortalError(401, 'Operator credentials required.');
}

export async function cleanupExpiredRuns(env: PortalEnv, limit: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new PortalError(422, 'Choose a cleanup batch from 1 to 20 runs.');
  const now = Date.now(), db = env.DB;
  const eligible = await db.prepare(`SELECT id FROM runs r WHERE expires_at<=?
    AND NOT EXISTS(SELECT 1 FROM asset_writes w WHERE w.run_id=r.id) ORDER BY expires_at,id LIMIT ?`).bind(now, limit).all<{ id: string }>();
  let runsRemoved = 0, assetsRemoved = 0;
  for (const run of eligible.results) {
    const files = await db.prepare('SELECT storage_key FROM assets WHERE run_id=?').bind(run.id).all<{ storage_key: string }>();
    for (const file of files.results) await env.BUCKET.delete(file.storage_key);
    const removed = await db.prepare(`DELETE FROM runs WHERE id=? AND expires_at<=?
      AND NOT EXISTS(SELECT 1 FROM asset_writes WHERE run_id=?)`).bind(run.id, now, run.id).run();
    if (removed.meta.changes) { runsRemoved++; assetsRemoved += files.results.length; }
  }
  const waiting = await db.prepare(`SELECT COUNT(*) n FROM runs r WHERE expires_at<=?
    AND EXISTS(SELECT 1 FROM asset_writes w WHERE w.run_id=r.id)`).bind(now).first<{ n: number }>();
  return { runsRemoved, assetsRemoved, runsWaitingForUploads: waiting?.n ?? 0 };
}
