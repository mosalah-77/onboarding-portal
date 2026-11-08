import test from 'node:test';
import assert from 'node:assert/strict';
import { png } from './storage-helpers.mjs';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5179';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Integration tests require a disposable loopback server.');
const valid = { goal: 'Explain the services', audience: 'Local residents', pages: ['Home', 'Services'], constraints: '', deadline: null, assetPlan: 'create', assetIds: [] };
async function demo() {
  let cookie = ''; let csrf = '';
  const client = { async call(path, body, options = {}) {
    const response = await fetch(`${origin}/api/portal${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: origin, 'X-Portal-Request': '1', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...options.headers },
      body: options.bytes ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = options.binary && response.ok ? new Uint8Array(await response.arrayBuffer()) : await response.json().catch(() => null);
    if (data?.csrf) csrf = data.csrf;
    return { status: response.status, data, headers: response.headers };
  }};
  const started = await client.call('/demo', {});
  return { client, started };
}
test('real backend: tenant boundaries, saves and retries', async t => {
  const { client: a, started } = await demo();
  assert.equal(started.status, 200, 'the backend creates a persisted demo');
  const projectId = started.data.projects[0].id;
  const { client: other, started: otherStart } = await demo();
  await t.test('separate visitors cannot read each other', async () => {
    assert.notEqual(otherStart.data.runId, started.data.runId);
    assert.equal((await other.call(`/projects/${projectId}`)).status, 404);
  });
  const owner = await a.call('/persona', { persona: 'owner' });
  const projectB = owner.data.projects.find(p => p.id !== projectId).id;
  await a.call('/persona', { persona: 'client-a' });
  await t.test('Client A cannot access Client B or forge an owner', async () => {
    assert.equal((await a.call(`/projects/${projectB}`)).status, 404);
    assert.equal((await a.call('/persona', { persona: otherStart.data.runId })).status, 422);
  });
  let project = (await a.call(`/projects/${projectId}`)).data;
  await t.test('six-field brief persists as a new immutable revision', async () => {
    const result = await a.call(`/projects/${projectId}/revisions`, { brief: valid, expectedToken: project.token, key: crypto.randomUUID() });
    assert.equal(result.status, 200);
    project = result.data.project;
    assert.equal(project.latestRevision.brief.audience, 'Local residents');
    assert.equal(project.revisions.length, 2);
    assert.equal(project.revisions[0].brief.audience, '');
  });
  await t.test('stale concurrent saves conflict without erasing a revision', async () => {
    const results = await Promise.all(['First edit', 'Second edit'].map(audience => a.call(`/projects/${projectId}/revisions`, { brief: { ...valid, audience }, expectedToken: project.token, key: crypto.randomUUID() })));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    project = (await a.call(`/projects/${projectId}`)).data;
    assert.equal(project.revisions.length, 3);
  });
  await t.test('lost-response retries return the same saved revision', async () => {
    const input = { brief: valid, expectedToken: project.token, key: crypto.randomUUID() };
    const first = await a.call(`/projects/${projectId}/revisions`, input);
    const retry = await a.call(`/projects/${projectId}/revisions`, input);
    assert.equal(retry.status, 200);
    assert.equal(first.data.operation.revisionId, retry.data.operation.revisionId);
    assert.equal(retry.data.project.revisions.length, 4);
    assert.equal((await a.call(`/projects/${projectId}/revisions`, { ...input, brief: { ...valid, goal: 'Different' } })).status, 409);
  });
  await t.test('missing CSRF is denied and malformed optional values fail', async () => {
    project = (await a.call(`/projects/${projectId}`)).data;
    assert.equal((await a.call(`/projects/${projectId}/revisions`, { brief: valid, expectedToken: project.token, key: crypto.randomUUID() }, { headers: { 'X-CSRF-Token': '' } })).status, 403);
    assert.equal((await a.call(`/projects/${projectId}/revisions`, { brief: { ...valid, deadline: 'not a date' }, expectedToken: project.token, key: crypto.randomUUID() })).status, 422);
  });
  await t.test('automatic requests resolve and reopen without losing comments', async () => {
    project = (await a.call(`/projects/${projectId}`)).data;
    const original = project.requests.find(r => r.ruleKey === 'audience.required');
    assert.equal(original.status, 'resolved');
    const comment = { text: 'The synthetic audience needs a clearer description.', key: crypto.randomUUID() };
    const first = await a.call(`/requests/${original.id}/comments`, comment);
    const retry = await a.call(`/requests/${original.id}/comments`, comment);
    assert.equal(first.status, 200);
    assert.equal(retry.data.operation.commentId, first.data.operation.commentId);
    for (let i = 0; i < 2; i++) {
      project = (await a.call(`/projects/${projectId}`)).data;
      assert.equal((await a.call(`/projects/${projectId}/revisions`, { brief: { ...valid, audience: '' }, expectedToken: project.token, key: crypto.randomUUID() })).status, 200);
    }
    project = (await a.call(`/projects/${projectId}`)).data;
    assert.equal(project.requests.filter(r => r.ruleKey === 'audience.required').length, 1);
    assert.equal(project.requests[0].id, original.id);
    assert.equal(project.requests[0].status, 'open');
    assert.equal(project.requests[0].comments.length, 1);
    assert.equal((await a.call(`/projects/${projectId}/submit`, { revisionId: project.latestRevision.id, expectedToken: project.token, key: crypto.randomUUID() })).status, 422);
    assert.equal((await a.call(`/requests/${original.id}/comments`, { text: ' ', key: crypto.randomUUID() })).status, 422);
    assert.equal((await a.call(`/requests/${original.id}/comments`, { text: 'x'.repeat(2001), key: crypto.randomUUID() })).status, 422);
    assert.equal((await other.call(`/requests/${original.id}/comments`, comment)).status, 404);
  });
  await t.test('required requests need owner resolution; optional requests do not block', async () => {
    const requestInput = { title: 'Confirm the page scope', explanation: 'Review the synthetic service page list.', required: true, key: crypto.randomUUID() };
    project = (await a.call(`/projects/${projectId}`)).data;
    assert.equal((await a.call(`/projects/${projectId}/requests`, { ...requestInput, expectedToken: project.token })).status, 403);
    await a.call('/persona', { persona: 'owner' });
    const created = await a.call(`/projects/${projectId}/requests`, { ...requestInput, expectedToken: project.token });
    assert.equal(created.status, 200);
    const retried = await a.call(`/projects/${projectId}/requests`, { ...requestInput, expectedToken: project.token });
    assert.equal(created.data.operation.requestId, retried.data.operation.requestId);
    const requestId = created.data.operation.requestId;
    project = created.data.project;
    await a.call(`/projects/${projectId}/requests`, { title: 'Optional inspiration', explanation: 'Share a reference if useful.', required: false, expectedToken: project.token, key: crypto.randomUUID() });
    await a.call('/persona', { persona: 'client-a' });
    project = (await a.call(`/projects/${projectId}`)).data;
    const saved = await a.call(`/projects/${projectId}/revisions`, { brief: valid, expectedToken: project.token, key: crypto.randomUUID() });
    project = saved.data.project;
    assert.equal((await a.call(`/projects/${projectId}/submit`, { revisionId: project.latestRevision.id, expectedToken: project.token, key: crypto.randomUUID() })).status, 422);
    assert.equal((await a.call(`/requests/${requestId}/resolve`, { explanation: 'Confirmed', expectedToken: project.token, key: crypto.randomUUID() })).status, 403);
    await a.call('/persona', { persona: 'owner' });
    assert.equal((await a.call(`/requests/${requestId}/resolve`, { explanation: '', expectedToken: project.token, key: crypto.randomUUID() })).status, 422);
    const resolved = await a.call(`/requests/${requestId}/resolve`, { explanation: 'The entered pages cover the agreed synthetic scope.', expectedToken: project.token, key: crypto.randomUUID() });
    assert.equal(resolved.status, 200);
    project = resolved.data.project;
    assert.equal(project.blockers.length, 0);
    assert.equal(project.requests.find(r => r.id === requestId).comments.length, 1);
    await a.call('/persona', { persona: 'client-a' });
    const submission = { revisionId: project.latestRevision.id, expectedToken: project.token, key: crypto.randomUUID() };
    const first = await a.call(`/projects/${projectId}/submit`, submission);
    const second = await a.call(`/projects/${projectId}/submit`, submission);
    assert.equal(first.status, 200);
    assert.equal(second.data.operation.id, first.data.operation.id);
    assert.equal(second.data.project.activity.filter(e => e.action === 'brief_submitted').length, 1);
    assert.equal(second.data.project.requests.filter(r => !r.ruleKey).length, 2);
  });
  await t.test('real R2 uploads are private, retryable and attachable only within their project', async () => {
    const key = crypto.randomUUID();
    const upload = (project, op = key, bytes = png) => a.call(`/projects/${project}/assets`, {}, { bytes, headers: { 'Content-Type': 'image/png', 'X-File-Name': 'sample.png', 'X-Operation-Key': op } });
    const first = await upload(projectId);
    assert.equal(first.status, 200);
    assert.equal((await upload(projectId)).data.id, first.data.id);
    assert.equal((await upload(projectId, key, new Uint8Array([...png, 1]))).status, 409);
    const fileA = first.data.id;
    const downloaded = await a.call(`/assets/${fileA}`, undefined, { binary: true });
    assert.deepEqual(downloaded.data, png);
    assert.match(downloaded.headers.get('content-disposition'), /^attachment;/);
    await a.call('/persona', { persona: 'client-b' });
    const fileB = (await upload(projectB, crypto.randomUUID())).data.id;
    assert.equal((await a.call(`/assets/${fileA}`)).status, 404);
    await a.call('/persona', { persona: 'client-a' });
    assert.equal((await a.call(`/assets/${fileB}`)).status, 404);
    assert.equal((await other.call(`/assets/${fileA}`)).status, 404);
    project = (await a.call(`/projects/${projectId}`)).data;
    assert.equal((await a.call(`/projects/${projectId}/revisions`, { brief: { ...valid, assetPlan: 'supplied', assetIds: [fileB] }, expectedToken: project.token, key: crypto.randomUUID() })).status, 422);
    const attached = await a.call(`/projects/${projectId}/revisions`, { brief: { ...valid, assetPlan: 'supplied', assetIds: [fileA] }, expectedToken: project.token, key: crypto.randomUUID() });
    assert.equal(attached.status, 200);
    assert.equal(attached.data.project.blockers.length, 0);
    assert.equal((await upload(projectId, crypto.randomUUID(), new Uint8Array(2097153))).status, 413);
  });
  await t.test('the final demo capacity slot cannot be reserved twice', async () => {
    for (let i = 0; i < 17; i++) assert.equal((await demo()).started.status, 200);
    const last = await Promise.all([demo(), demo()]);
    assert.deepEqual(last.map(r => r.started.status).sort(), [200, 429]);
    assert.equal((await demo()).started.status, 429);
  });
});
