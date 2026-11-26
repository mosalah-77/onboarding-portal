import test from 'node:test';
import assert from 'node:assert/strict';
import { progress, canSend, summary } from '../lib/conversation.ts';

const empty = { goal: '', audience: '', pages: [], constraints: '', deadline: null, assetPlan: '', assetIds: [] };
const full = { ...empty, goal: 'More quote requests', audience: 'Homeowners', pages: ['Home'], assetPlan: 'create' };
let n = 0;
const event = (action, details = {}) => ({ id: `e${++n}`, actor: 'x', action, details, createdAt: n });
// The server returns activity newest first.
const project = (state, brief, events) => ({ state, blockers: [], latestRevision: { brief }, revisions: [{ actor: 'client-a' }], activity: [...events].reverse() });

test('a new brief asks one question at a time and cannot be sent early', () => {
  const p = project('draft', { ...empty, goal: 'More quote requests' }, [event('demo_created'), event('brief_saved')]);
  const state = progress(p);
  assert.equal(state.ask, 'audience');
  assert.equal(state.round, 1);
  assert.equal(state.missing, 3);
  assert.deepEqual(state.items.map(i => i.key), ['hi', 'q-goal', 'a-goal', 'q-audience']);
  assert.equal(canSend(p, state), false);
  assert.equal(summary(p, state, 'client').head, '3 answers to go');
});
test('optional questions are asked until answered or skipped, then the brief can go', () => {
  const p = project('draft', full, [event('brief_saved')]);
  assert.equal(progress(p).ask, 'deadline');
  assert.equal(canSend(p, progress(p)), false);
  assert.equal(summary(p, progress(p), 'client').sub, 'Answer or skip the 2 optional questions, then send it.');
  assert.equal(summary(p, progress(p, ['deadline']), 'client').sub, 'Answer or skip the last optional question, then send it.');
  const state = progress(p, ['deadline', 'constraints']);
  assert.equal(state.ask, null);
  assert.equal(canSend(p, state), true);
  assert.equal(summary(p, state, 'client').head, 'Ready to send');
});
test('a brief sent back needs a change before it can be sent as the next version', () => {
  const events = [event('brief_saved'), event('brief_submitted'), event('brief_returned', { reason: 'Add a prices page.' })];
  let p = project('draft', full, events), state = progress(p);
  assert.equal(state.round, 2);
  assert.equal(state.handedBack, 'returned');
  assert.equal(canSend(p, state), false);
  assert.ok(state.items.some(i => i.kind === 'text' && i.text === 'Add a prices page.'));
  assert.equal(summary(p, state, 'client').head, 'Sent back for changes');
  p = project('draft', full, [...events, event('brief_saved', { fields: ['pages', 'assetIds', 'assetPlan'] })]); state = progress(p);
  assert.equal(canSend(p, state), true);
  assert.equal(state.items.at(-1).text, 'Jackie changed pages, photos and logo');
});
test('approval is shown against the version that was sent', () => {
  const p = project('approved', full, [event('brief_saved'), event('brief_submitted'), event('brief_returned', { reason: 'x' }), event('brief_saved'), event('brief_submitted'), event('brief_approved')]);
  const state = progress(p);
  assert.equal(state.round, 2);
  assert.deepEqual(state.items.at(-1), { key: state.items.at(-1).key, kind: 'approved', round: 2, at: state.approvedAt });
  assert.equal(summary(p, state, 'studio').stage, 2);
});
