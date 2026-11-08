import test from 'node:test';
import assert from 'node:assert/strict';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5179';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Integration tests require a disposable loopback server.');
const valid = { goal: 'Explain the services', audience: 'Local residents', pages: ['Home', 'Services'], constraints: '', deadline: null, assetPlan: 'create', assetIds: [] };
async function demo() {
  let cookie = ''; let csrf = '';
  const client = { async call(path, body, options = {}) {
    const response = await fetch(`${origin}/api/portal${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: origin, 'X-Portal-Request': '1', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...options.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await response.json().catch(() => null);
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
  await t.test('the final demo capacity slot cannot be reserved twice', async () => {
    for (let i = 0; i < 17; i++) assert.equal((await demo()).started.status, 200);
    const last = await Promise.all([demo(), demo()]);
    assert.deepEqual(last.map(r => r.started.status).sort(), [200, 429]);
    assert.equal((await demo()).started.status, 429);
  });
});
