import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPortal } from '../lib/client.ts';

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
