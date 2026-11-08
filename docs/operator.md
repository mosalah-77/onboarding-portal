# Operating the synthetic demo

Author: GPT/Codex. Updated 8 November 2026.

`DEMO_ADMIN_TOKEN` is a server-only Sites secret. Never put it in the hosting manifest, a public environment variable, browser code, a URL or Git. Local environment files are ignored. Keep a separate private copy for maintenance.

## Expiry and cleanup

Sessions expire after 24 hours. Expiry immediately prevents reads and writes; it does not immediately delete stored bytes. Reset atomically expires only the current run and seeds a replacement. If capacity is full, reset fails without expiring the existing run.

Run the operator script with the secret in the process environment:

```sh
node --env-file=.env.operator scripts/cleanup-demo.mjs https://your-demo-host
```

It requests up to five expired runs. Repeat until `runsRemoved` is zero. HTTPS is required outside loopback, redirects are refused and the token is not logged. Do not schedule this command until a recurring schedule has been explicitly chosen.

The server deletes all R2 objects for a run before deleting its SQL row and cascading metadata. If storage deletion fails, the SQL rows and their quota remain available for a safe retry. Re-deleting an already removed object is harmless. Active runs are never eligible.

Every upload attempt holds a durable `asset_writes` claim while writing storage. Cleanup skips runs with claims, so an upload cannot recreate an object after cleanup frees its quota. `runsWaitingForUploads` reports expired runs with outstanding claims.

If a Worker terminates before releasing a claim, it remains reserved. Investigate the run and object keys before repair. Do not expire claims merely because a timer elapsed: the corresponding write might still be running. This prototype has no automatic abandoned-claim repair. For larger public use, add a coordinated cancellation/repair mechanism and abuse throttling.

## Capacity and release

There are at most 20 stored runs, 500 workflow mutations per project, 50 manual requests per project, five asset slots per project, 2 MiB per asset, 20 MiB reserved per run and 200 MiB reserved globally. Pending uploads count toward storage caps. These are demo bounds, not production service guarantees.

Deployment uses the Sites source and archive workflow. Apply environment changes by deploying a saved version. Keep the exact source commit and built archive together. The second migration only adds write-claim storage; production migration application is owned by Sites. A rollback must retain compatible database tables and runtime bindings. Re-deploy the previous saved version when appropriate; do not erase data or reverse migrations as a routine rollback.
