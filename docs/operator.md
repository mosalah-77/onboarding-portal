# Operating the synthetic demo

Author: Mohamed Elmorshedy. Updated 23 November 2026.

`DEMO_ADMIN_TOKEN` is a Worker secret, set with `wrangler secret put DEMO_ADMIN_TOKEN`. Never put it in `vite.config.ts`, a public environment variable, browser code, a URL or Git. Local environment files are ignored. Keep a separate private copy for maintenance.

## Expiry and cleanup

Sessions expire after 24 hours. Expiry immediately prevents reads and writes; it does not immediately delete stored bytes. Reset atomically expires only the current run and seeds a replacement. If capacity is full, reset fails without expiring the existing run.

Run the operator script with the secret in the process environment:

```sh
node --env-file=.env.operator scripts/cleanup-demo.mjs https://your-demo-host
```

It requests up to five expired runs. Repeat until `runsRemoved` is zero. HTTPS is required outside loopback, redirects are refused and the token is not logged. Do not schedule this command until a recurring schedule has been explicitly chosen.

The server deletes all stored file rows for a run before deleting its SQL row and cascading metadata. If storage deletion fails, the SQL rows and their quota remain available for a safe retry. Re-deleting an already removed object is harmless. Active runs are never eligible.

Every upload attempt holds a durable `asset_writes` claim while writing storage. Cleanup skips runs with claims, so an upload cannot recreate an object after cleanup frees its quota. `runsWaitingForUploads` reports expired runs with outstanding claims.

If a Worker terminates before releasing a claim, it remains reserved. Investigate the run and object keys before repair. Do not expire claims merely because a timer elapsed: the corresponding write might still be running. This prototype has no automatic abandoned-claim repair. For larger public use, add a coordinated cancellation/repair mechanism and abuse throttling.

## Capacity and release

There are at most 20 stored runs, 500 workflow mutations per project, 50 manual requests per project, five asset slots per project, 1.9 MB per asset, 20 MiB reserved per run and 200 MiB reserved globally. Pending uploads count toward storage caps. These are demo bounds, not production service guarantees.

The demo is the Worker `client-brief` with the D1 database of the same name, on the Cloudflare free plan. `npm run build` then `npm run deploy` publishes the current source. Apply a new migration to the remote database with `wrangler d1 execute DB --remote --config dist/server/wrangler.json --file <migration>` before deploying code that needs it. The second migration adds write-claim storage and the third adds the `objects` table for file bytes. D1 limits a row to 2 MB, which is why a file is capped at 1.9 MB. A rollback must retain compatible database tables. Use `wrangler rollback` to return to the previous Worker version; do not erase data or reverse migrations as a routine rollback.
