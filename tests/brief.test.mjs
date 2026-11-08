import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBrief, readiness, checklist } from '../lib/brief.ts';

const ready = { goal: 'Explain our synthetic services', audience: 'Local residents', pages: ['Home', 'Services'], constraints: '', deadline: null, assetPlan: 'create', assetIds: [] };
test('blank optional values do not block a complete brief', () => {
  assert.deepEqual(readiness(validateBrief(ready), new Set()), []);
});
test('an incomplete draft is saved but its missing audience blocks submission', () => {
  assert.deepEqual(readiness(validateBrief({ ...ready, audience: '  ' }), new Set()).map(x => x.key), ['audience.required']);
});
test('normalised page duplicates and oversized values fail validation', () => {
  for (const patch of [{ pages: ['Home', ' home '] }, { goal: 'x'.repeat(2001) }, { pages: ['x'.repeat(81)] }, { pages: Array.from({ length: 11 }, (_, i) => String(i)) }]) {
    assert.throws(() => validateBrief({ ...ready, ...patch }), { status: 422 });
  }
});
test('calendar dates must exist but a past requested date remains unchanged', () => {
  for (const deadline of ['2026-02-30', '2026-13-01', 'tomorrow']) assert.throws(() => validateBrief({ ...ready, deadline }), { status: 422 });
  assert.equal(validateBrief({ ...ready, deadline: '2020-02-29' }).deadline, '2020-02-29');
});
test('supplied assets must be ready and attached to this revision', () => {
  const brief = { ...ready, assetPlan: 'supplied', assetIds: ['file-a'] };
  assert.deepEqual(readiness(brief, new Set(['file-b'])).map(x => x.key), ['assets.required']);
  assert.deepEqual(readiness(brief, new Set(['file-a'])), []);
});
test('malformed shapes do not reach storage', () => {
  for (const patch of [{ goal: 5 }, { pages: 'Home' }, { assetIds: ['a', 'a'] }, { assetPlan: 'invented' }, { constraints: null }]) {
    assert.throws(() => validateBrief({ ...ready, ...patch }), { status: 422 });
  }
});
test('the accepted checklist includes a responsive and accessibility review tied to its pages', () => {
  assert.deepEqual(checklist(ready).find(t => t.id === 'accessibility'), { id: 'accessibility', text: 'Review responsive layouts and accessibility for the accepted pages', source: 'pages' });
});
test('validation identifies the field a client must correct', () => {
  assert.throws(() => validateBrief({ ...ready, pages: ['Home', 'home'] }), e => e.status === 422 && e.details?.[0]?.field === 'pages');
  assert.throws(() => validateBrief({ ...ready, deadline: '2026-02-30' }), e => e.status === 422 && e.details?.[0]?.field === 'deadline');
});
