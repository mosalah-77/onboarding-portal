import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPortal, reconcileEditor } from '../lib/client.ts';

test('the browser request preserves structured field errors and does not treat them as success', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Complete the required inputs.', details: [{ field: 'audience', message: 'Add the audience.' }] }, { status: 422 }));
  await assert.rejects(requestPortal('/test', 'csrf', { value: 'still in the form' }), e => e.status === 422 && e.details[0].field === 'audience');
});
test('an uncertain network failure remains retryable', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(requestPortal('/test', 'csrf', { key: 'same-operation' }), e => e.status === 0);
});
test('browser writes send the original operation key and CSRF header', async t => {
  let captured;
  t.mock.method(globalThis, 'fetch', async (url, init) => { captured = init; return Response.json({ ok: true }); });
  const body = { key: 'same-operation', expectedToken: 12 };
  await requestPortal('/test', 'csrf', body);
  assert.equal(captured.headers['X-CSRF-Token'], 'csrf');
  assert.deepEqual(JSON.parse(captured.body), body);
});

const brief = { goal: 'Original scope', audience: 'Residents', pages: ['Home'], constraints: '', deadline: null, assetPlan: 'create', assetIds: [] };
const viewed = { token: 2, latestRevision: { id: 'v2', version: 2, brief } };
const newer = { token: 5, latestRevision: { id: 'v3', version: 3, brief: { ...brief, goal: 'Changed scope from another tab' } } };
test('a comment response with a newer revision refreshes clean fields before approval', () => {
  const editor = reconcileEditor(null, viewed);
  const updated = reconcileEditor(editor, newer);
  assert.equal(updated.draft.goal, newer.latestRevision.brief.goal);
  assert.equal(updated.revisionId, newer.latestRevision.id);
  assert.equal(updated.token, newer.token);
  assert.deepEqual(updated.draft, updated.baseline);
});
test('a newer revision preserves unsaved fields and requires explicit reconciliation', () => {
  const original = reconcileEditor(null, viewed);
  const editing = { ...original, draft: { ...brief, goal: 'My unsaved scope' } };
  const stale = reconcileEditor(editing, newer);
  assert.equal(stale.draft.goal, 'My unsaved scope');
  assert.equal(stale.revisionId, 'v2');
  assert.equal(stale.token, viewed.token);
  assert.notDeepEqual(stale.draft, stale.baseline);
  const reviewed = reconcileEditor(stale, newer, 'preserve');
  assert.equal(reviewed.draft.goal, 'My unsaved scope');
  assert.equal(reviewed.baseline.goal, newer.latestRevision.brief.goal);
  assert.equal(reviewed.token, newer.token);
  assert.notDeepEqual(reviewed.draft, reviewed.baseline);
});
