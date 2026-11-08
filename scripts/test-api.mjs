import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const config = path.join(root, 'dist/server/wrangler.json');
await readFile(config); // Require a built Worker, not a dev-server-only test.
await mkdir(path.join(root, '.wrangler'), { recursive: true });
await mkdir(path.join(root, '.sites-runtime'), { recursive: true });
const state = await mkdtemp(path.join(root, '.wrangler/test-'));
const logPath = path.join(root, '.sites-runtime/api-runtime.log');
const log = openSync(logPath, 'w');
const wrangler = ['--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js'];
const probe = createServer();
probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
let server;
try {
  for (const file of (await readdir('drizzle')).filter(f => f.endsWith('.sql')).sort()) {
    const migrated = spawnSync(process.execPath, [...wrangler, 'd1', 'execute', 'DB', '--local', '--config', config, '--persist-to', state, '--file', `drizzle/${file}`], { stdio: ['ignore', log, log] });
    if (migrated.status !== 0) throw new Error('Local test migration failed.');
  }
  server = spawn(process.execPath, [...wrangler, 'dev', '--config', config, '--local', '--persist-to', state, '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0', '--var', 'DEMO_ADMIN_TOKEN:local-test-only'], { stdio: ['ignore', log, log] });
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error('The local test Worker exited early.');
    try { if ((await fetch(`${origin}/api/portal/session`)).status === 401) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('The local test Worker did not become ready.');
  const result = spawnSync(process.execPath, ['--test', 'tests/api.test.mjs'], { stdio: 'inherit', env: { ...process.env, TEST_ORIGIN: origin } });
  if (result.status !== 0) throw new Error('API integration tests failed.');
} catch (error) {
  console.error(error.message);
  console.error((await readFile(logPath, 'utf8')).slice(-5000));
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const ended = once(server, 'exit'); server.kill('SIGTERM');
    await Promise.race([ended, new Promise(resolve => setTimeout(resolve, 2000))]);
    if (server.exitCode === null) { server.kill('SIGKILL'); await ended; }
  }
  closeSync(log);
  await rm(state, { recursive: true, force: true });
}
