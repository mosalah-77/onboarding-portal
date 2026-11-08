import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, png, stream } from './storage-helpers.mjs';
import { uploadAsset, downloadAsset } from '../lib/assets.ts';
import { getProject } from '../lib/workflow.ts';

const send = (f, key = crypto.randomUUID(), bytes = png, name = 'sample.png', type = 'image/png') => uploadAsset(f.env, f.actor, f.projectId, key, name, type, stream(bytes));
const status = n => e => e.status === n;
test('invalid file labels, bytes, names and streamed oversize are rejected before reservation', async t => {
  const f = await fixture(); t.after(f.close);
  for (const [bytes, name, type, expected] of [
    [new TextEncoder().encode('<script>bad</script>'), 'sample.png', 'image/png', 422],
    [png, 'sample.pdf', 'application/pdf', 422], [png, 'sample.svg', 'image/png', 422],
    [png, 'bad\r\nname.png', 'image/png', 422], [new Uint8Array(2 * 1024 * 1024 + 1), 'big.png', 'image/png', 413],
  ]) await assert.rejects(send(f, crypto.randomUUID(), bytes, name, type), status(expected));
  assert.equal(f.env.DB.sqlite.prepare('SELECT COUNT(*) n FROM assets').get().n, 0);
});
test('storage failure preserves the brief and retry completes the same reservation', async t => {
  const f = await fixture(); t.after(f.close);
  const before = await getProject(f.env.DB, f.actor, f.projectId), key = crypto.randomUUID();
  f.env.BUCKET.failPut = true;
  await assert.rejects(send(f, key), /storage failure/);
  assert.deepEqual((await getProject(f.env.DB, f.actor, f.projectId)).latestRevision, before.latestRevision);
  const first = await send(f, key), retry = await send(f, key);
  assert.equal(first.id, retry.id);
  assert.equal(f.env.DB.sqlite.prepare('SELECT COUNT(*) n FROM assets').get().n, 1);
  assert.equal((await getProject(f.env.DB, f.actor, f.projectId)).activity.filter(e => e.action === 'asset_uploaded').length, 1);
  await assert.rejects(send(f, key, new Uint8Array([...png, 1])), status(409));
});
test('SQL failure after object write leaves an upload that can be reconciled', async t => {
  const f = await fixture(); t.after(f.close); const key = crypto.randomUUID();
  f.env.BUCKET.afterPut = () => { f.env.DB.failBatch = true; };
  await assert.rejects(send(f, key), /finalisation failure/);
  assert.equal(f.env.BUCKET.objects.size, 1);
  assert.equal(f.env.DB.sqlite.prepare('SELECT status FROM assets').get().status, 'pending');
  assert.equal((await send(f, key)).status, 'ready');
  assert.equal(f.env.BUCKET.objects.size, 1);
});
test('pending reservations count towards the five-file project limit', async t => {
  const f = await fixture(); t.after(f.close);
  for (let i = 0; i < 4; i++) { f.env.BUCKET.failPut = true; await assert.rejects(send(f)); }
  const results = await Promise.allSettled([send(f), send(f)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 429);
  assert.equal(f.env.DB.sqlite.prepare('SELECT COUNT(*) n FROM assets').get().n, 5);
});
test('run and global byte reservations leave capacity for only one contender', async t => {
  for (const global of [false, true]) {
    const f = await fixture(); t.after(f.close);
    const runId = global ? 'another-run' : f.actor.runId;
    if (global) f.env.DB.sqlite.prepare('INSERT INTO runs VALUES (?,?,?)').run(runId, 0, Date.now() + 999999);
    f.env.DB.sqlite.prepare(`INSERT INTO assets VALUES ('filler',?,?, 'filler','filler','hash','filler.png','image/png',?,'pending','system',?)`).run(runId, f.projectId, (global ? 200 : 20) * 1024 * 1024 - png.length, Date.now());
    const results = await Promise.allSettled([send(f), send(f)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.find(r => r.status === 'rejected').reason.status, 429);
  }
});
test('downloads are private attachments and missing storage fails safely', async t => {
  const f = await fixture(); t.after(f.close); const file = await send(f);
  const response = await downloadAsset(f.env, f.actor, file.id);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-disposition'), /^attachment;/);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
  await assert.rejects(downloadAsset(f.env, { ...f.actor, personaId: 'client-b' }, file.id), status(404));
  await assert.rejects(downloadAsset(f.env, { ...f.actor, runId: 'another-run' }, file.id), status(404));
  f.env.BUCKET.objects.clear();
  await assert.rejects(downloadAsset(f.env, f.actor, file.id), status(503));
});
