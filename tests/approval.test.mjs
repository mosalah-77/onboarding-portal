import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './storage-helpers.mjs';
import { getProject, saveRevision, submitBrief, approveBrief, reopenBrief, commentOnRequest, createRequest } from '../lib/workflow.ts';

async function submitted(f) {
  f.env.DB.sqlite.prepare("UPDATE sessions SET persona='owner' WHERE id=?").run(f.actor.sessionId);
  f.actor.personaId = 'owner'; f.actor.role = 'owner';
  let p = await getProject(f.env.DB, f.actor, f.projectId);
  p = (await saveRevision(f.env.DB, f.actor, f.projectId, p.token, crypto.randomUUID(), { ...p.latestRevision.brief, audience: 'Workshop visitors' })).project;
  return (await submitBrief(f.env.DB, f.actor, f.projectId, p.latestRevision.id, p.token, crypto.randomUUID())).project;
}
test('a failed conditional approval cannot leave an approval, receipt or event', async t => {
  const f = await fixture(); t.after(f.close); const p = await submitted(f);
  const db = f.env.DB, originalBatch = db.batch.bind(db);
  const before = ['approvals', 'receipts', 'events'].map(table => db.sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n);
  db.batch = statements => { db.sqlite.prepare('UPDATE projects SET token=token+1 WHERE id=?').run(p.id); return originalBatch(statements); };
  await assert.rejects(approveBrief(db, f.actor, p.id, p.latestRevision.id, p.token, crypto.randomUUID()), e => e.status === 409);
  assert.deepEqual(['approvals', 'receipts', 'events'].map(table => db.sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n), before);
});
test('handoff keeps accepted facts after reopening and saving different pages and date', async t => {
  const f = await fixture(); t.after(f.close); let p = await submitted(f);
  p = (await approveBrief(f.env.DB, f.actor, p.id, p.latestRevision.id, p.token, crypto.randomUUID())).project;
  const accepted = p.acceptedRevision;
  assert.equal(p.handoff.deadline, 'Not agreed');
  assert.deepEqual(p.handoff.assetIds, []);
  assert.deepEqual(p.handoff.tasks.filter(x => x.source.startsWith('pages.')).map(x => x.text), ['Prepare the Home page', 'Prepare the Services page', 'Prepare the Contact page']);
  assert.equal(p.handoff.tasks[0].source, 'pages.0');
  await assert.rejects(reopenBrief(f.env.DB, f.actor, p.id, '', p.token, crypto.randomUUID()), e => e.status === 422);
  p = (await reopenBrief(f.env.DB, f.actor, p.id, 'The client requested an additional page.', p.token, crypto.randomUUID())).project;
  await assert.rejects(submitBrief(f.env.DB, f.actor, p.id, p.latestRevision.id, p.token, crypto.randomUUID()), e => e.status === 409);
  p = (await saveRevision(f.env.DB, f.actor, p.id, p.token, crypto.randomUUID(), { ...p.latestRevision.brief, pages: ['New page'], deadline: '2030-01-01' })).project;
  assert.deepEqual(p.acceptedRevision, accepted);
  assert.deepEqual(p.handoff.pages, ['Home', 'Services', 'Contact']);
  assert.equal(p.handoff.deadline, 'Not agreed');
  assert.equal(p.activity.find(e => e.action === 'brief_reopened').details.reason, 'The client requested an additional page.');
});

for (const kind of ['save', 'comment', 'request']) test(`overlapping identical ${kind} retries return one successful operation`, async t => {
  const f = await fixture(); t.after(f.close);
  const db = f.env.DB;
  db.sqlite.prepare("UPDATE sessions SET persona='owner' WHERE id=?").run(f.actor.sessionId);
  f.actor.personaId = 'owner'; f.actor.role = 'owner';
  const p = await getProject(db, f.actor, f.projectId), key = crypto.randomUUID();
  const originalBatch = db.batch.bind(db);
  let arrivals = 0, release;
  const bothReady = new Promise(resolve => { release = resolve; });
  db.batch = async statements => {
    if (++arrivals === 2) release();
    await bothReady;
    return originalBatch(statements);
  };
  const action = kind === 'save' ? () => saveRevision(db, f.actor, p.id, p.token, key, { ...p.latestRevision.brief, audience: 'Residents' })
    : kind === 'comment' ? () => commentOnRequest(db, f.actor, p.requests[0].id, 'One comment despite a concurrent retry', key)
    : () => createRequest(db, f.actor, p.id, { title: 'One optional request', explanation: 'A retry must return the same request.', required: false }, p.token, key);
  const before = await getProject(db, f.actor, p.id);
  const results = await Promise.allSettled([action(), action()]);
  assert.deepEqual(results.map(r => r.status), ['fulfilled', 'fulfilled']);
  assert.equal(results[0].value.operation.id, results[1].value.operation.id);
  const after = await getProject(db, f.actor, p.id);
  assert.equal(after.activity.length, before.activity.length + 1);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM receipts WHERE project_id=?').get(p.id).n, 1);
  if (kind === 'save') assert.equal(after.revisions.length, before.revisions.length + 1);
  if (kind === 'comment') assert.equal(after.requests[0].comments.length, 1);
  if (kind === 'request') assert.equal(after.requests.length, before.requests.length + 1);
});
