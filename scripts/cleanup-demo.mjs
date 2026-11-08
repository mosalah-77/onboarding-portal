const origin = process.argv[2];
if (!origin || !process.env.DEMO_ADMIN_TOKEN) throw new Error('Usage: DEMO_ADMIN_TOKEN=<server token> node scripts/cleanup-demo.mjs https://your-demo-host');
const url = new URL('/api/portal/admin/cleanup', origin);
if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Use HTTPS outside local development.');
const response = await fetch(url, { method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${process.env.DEMO_ADMIN_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 5 }) });
if (!response.ok) throw new Error(`Cleanup failed (${response.status}); no token was logged. Retry after checking the server.`);
console.log(await response.json());
