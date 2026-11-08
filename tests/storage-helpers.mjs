import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { startDemo, requireActor } from '../lib/session.ts';

// Real SQLite executes our SQL; only unavailable storage faults are injected.
export async function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort())
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  const db = { failBatch: false, sqlite, prepare(sql) {
    const statement = { args: [], bind(...args) { this.args = args; return this; },
      async first() { return sqlite.prepare(sql).get(...this.args) ?? null; },
      async all() { return { results: sqlite.prepare(sql).all(...this.args) }; },
      execute() { const r = sqlite.prepare(sql).run(...this.args); return { meta: { changes: Number(r.changes) } }; },
      async run() { return this.execute(); },
    }; return statement;
  }, async batch(statements) {
    if (this.failBatch) { this.failBatch = false; throw new Error('Injected database finalisation failure'); }
    sqlite.exec('BEGIN');
    try { const results = statements.map(s => s.execute()); sqlite.exec('COMMIT'); return results; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }};
  const objects = new Map();
  const bucket = { failPut: false, afterPut: null, async put(key, bytes, options) {
    if (this.failPut) { this.failPut = false; throw new Error('Injected storage failure'); }
    if (objects.has(key) && options?.onlyIf) return null;
    objects.set(key, { bytes: new Uint8Array(bytes), customMetadata: options?.customMetadata });
    this.afterPut?.(); this.afterPut = null;
    return { key };
  }, async head(key) { return objects.get(key) ?? null; }, async get(key) {
    const o = objects.get(key); return o ? { ...o, body: new Blob([o.bytes]).stream() } : null;
  }, async delete(key) { for (const k of [key].flat()) objects.delete(k); }, objects };
  const request = new Request('http://localhost/api/portal/demo', { method: 'POST', headers: { Origin: 'http://localhost', 'X-Portal-Request': '1' } });
  const response = await startDemo(db, request), session = await response.json();
  const actor = await requireActor(new Request(request.url, { headers: { cookie: response.headers.get('set-cookie').split(';')[0] } }), db);
  return { env: { DB: db, BUCKET: bucket }, actor, cookie: response.headers.get('set-cookie').split(';')[0], projectId: session.projects[0].id, close: () => sqlite.close() };
}
export const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
export const stream = bytes => new Blob([bytes]).stream();
