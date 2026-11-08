import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, png, stream } from './storage-helpers.mjs';
import { cleanupExpiredRuns } from '../lib/cleanup.ts';
import { uploadAsset } from '../lib/assets.ts';
import { requireActor, startDemo } from '../lib/session.ts';
import { handlePortalRequest } from '../lib/http.ts';

const expire = f => f.env.DB.sqlite.prepare('UPDATE runs SET expires_at=0 WHERE id=?').run(f.actor.runId);
const count = (f, table) => f.env.DB.sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;
const upload = (f, key = crypto.randomUUID()) => uploadAsset(f.env, f.actor, f.projectId, key, 'sample.png', 'image/png', stream(png));
const req = (f, path, body = {}) => new Request(`http://localhost/api/portal${path}`, { method: 'POST', headers: { cookie: f.cookie, Origin: 'http://localhost', 'X-Portal-Request': '1', 'X-CSRF-Token': f.actor.csrf, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('expired sessions cannot reach a workspace', async t => {
  const f = await fixture(); t.after(f.close); expire(f);
  await assert.rejects(requireActor(req(f, '/session'), f.env.DB), e => e.status === 401);
});
test('operator cleanup rejects absent or wrong credentials, and validates the batch bound', async t => {
  const f = await fixture(); t.after(f.close); expire(f);
  const call = (token, limit) => handlePortalRequest(new Request('https://demo.test/api/portal/admin/cleanup', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ limit }) }), f.env);
  assert.equal((await call('test-operator', 5)).status, 401);
  f.env.DEMO_ADMIN_TOKEN = 'test-operator';
  assert.equal((await call('wrong', 5)).status, 401);
  assert.equal((await call('test-operator', 0)).status, 422);
  assert.equal((await call('test-operator', 21)).status, 422);
  const result = await call('test-operator', 5);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).runsRemoved, 1);
});
test('partial storage cleanup retains all accounting until a repeat completes it', async t => {
  const f = await fixture(); t.after(f.close);
  await upload(f); await upload(f); expire(f);
  const original = f.env.BUCKET.delete.bind(f.env.BUCKET); let calls = 0;
  f.env.BUCKET.delete = async key => { if (++calls === 2) throw new Error('Injected deletion failure'); await original(key); };
  await assert.rejects(cleanupExpiredRuns(f.env, 5), /deletion failure/);
  assert.equal(count(f, 'runs'), 1); assert.equal(count(f, 'assets'), 2);
  assert.equal(f.env.BUCKET.objects.size, 1);
  assert.deepEqual(await cleanupExpiredRuns(f.env, 5), { runsRemoved: 1, assetsRemoved: 2, runsWaitingForUploads: 0 });
  assert.equal(f.env.BUCKET.objects.size, 0); assert.equal(count(f, 'sessions'), 0);
  assert.equal((await cleanupExpiredRuns(f.env, 5)).runsRemoved, 0);
});
test('cleanup waits for in-flight upload retries before releasing their rows or quota', async t => {
  const f = await fixture(); t.after(f.close);
  let release, entered; const gate = new Promise(r => { release = r; }), started = new Promise(r => { entered = r; });
  const put = f.env.BUCKET.put.bind(f.env.BUCKET); let writers = 0;
  f.env.BUCKET.put = async (...args) => { if (++writers === 2) entered(); await gate; return put(...args); };
  const key = crypto.randomUUID(); const pending = Promise.allSettled([upload(f, key), upload(f, key)]);
  await started; expire(f);
  assert.deepEqual(await cleanupExpiredRuns(f.env, 5), { runsRemoved: 0, assetsRemoved: 0, runsWaitingForUploads: 1 });
  assert.equal(count(f, 'assets'), 1);
  release(); const results = await pending;
  assert.ok(results.every(r => r.status === 'rejected' && r.reason.status === 409));
  assert.equal(count(f, 'asset_writes'), 0);
  assert.equal((await cleanupExpiredRuns(f.env, 5)).runsRemoved, 1);
  assert.equal(f.env.BUCKET.objects.size, 0);
});
test('reset replaces only the current run and leaves other visitors active', async t => {
  const f = await fixture(); t.after(f.close);
  const other = await startDemo(f.env.DB, req(f, '/demo'));
  const otherCookie = other.headers.get('set-cookie').split(';')[0];
  const result = await handlePortalRequest(req(f, '/demo/reset'), f.env);
  assert.equal(result.status, 200);
  assert.notEqual((await result.json()).runId, f.actor.runId);
  await assert.rejects(requireActor(req(f, '/session'), f.env.DB), e => e.status === 401);
  await requireActor(new Request('http://localhost', { headers: { cookie: otherCookie } }), f.env.DB);
});
test('stored expired runs count toward capacity; failed reset preserves the current run', async t => {
  const f = await fixture(); t.after(f.close);
  for (let i = 0; i < 19; i++) f.env.DB.sqlite.prepare('INSERT INTO runs VALUES (?,?,?)').run(`old-${i}`, 0, 0);
  const response = await handlePortalRequest(req(f, '/demo/reset'), f.env);
  assert.equal(response.status, 429);
  await requireActor(req(f, '/session'), f.env.DB);
  assert.equal(count(f, 'runs'), 20);
  assert.equal((await cleanupExpiredRuns(f.env, 5)).runsRemoved, 5);
  assert.equal(count(f, 'runs'), 15);
  assert.equal((await handlePortalRequest(req(f, '/demo/reset'), f.env)).status, 200);
});
