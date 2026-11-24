# Samepage

Website briefs for studios and their clients. This is a portfolio prototype I built on my own, with AI assistance. A fictional studio asks a fictional client six questions in a chat, the client sends the brief, and the studio approves one version or sends it back with a note. Nobody commissioned it, and I am not claiming paying clients, adoption or time saved.

[Open the public demo](https://samepage.mosalah-77.workers.dev) · [Browse the core logic](https://github.com/mosalah-77/samepage/tree/main/lib) · [How it works](https://samepage.mosalah-77.workers.dev/how-it-works)

The demo runs on the Cloudflare Workers free plan. See [verification](docs/verification.md) for what was checked there and when.

## Try the workflow

1. Start a demo. You are Jackie, the client. Answer the four required questions; the two optional ones can be skipped.
2. Choose **Send for approval**. Then switch the seat at the top right to **Studio**. You are now Viktor.
3. Choose **Ask for changes** and write a note. Switch back to **Client**, change an answer with its **Edit** link and send version 2.
4. As the studio, approve version 2. The panel shows the first jobs and **Download handoff** saves them as text.
5. As the studio, open the project menu and pick Marsh Lane Vets. Switch to **Client**: the menu is gone, because Jackie's seat belongs to one project and the server refuses the other.

Seat switching simulates roles within one visitor's isolated run. It is not production customer authentication. Use made-up text and files only. Runs expire after 24 hours.

## What works

- A conversation interface: one question at a time, a composer that changes with the question (text, page tick boxes, a file picker, a calendar) and a side panel with the status and the next action.
- Every answer is saved as an immutable revision in D1. The thread is rebuilt from saved data, so a reload or the other seat shows the same conversation.
- The studio approves one sent revision, or hands the brief back with a note. An approved brief can be reopened with a reason, and the approved version stays the agreed scope until another is approved.
- A downloadable handoff with a first-jobs list. A missing launch date adds a job to agree one; an entered date adds a job to check it.
- Private file uploads, stored in D1, with membership checks on every download, bounded storage and recoverable retries.
- Server-side permission, concurrency, validation and idempotency checks. A failed request leaves the typed answer in place and offers a retry that cannot save twice.
- Light and dark themes. The first visit follows the system setting; the button in the top bar switches and remembers the choice.
- Phone layout, keyboard operation, visible focus and an in-app explanation at `/how-it-works`. Two things animate, a message arriving and the approval tick, and both are off for visitors who ask for reduced motion.
- Security headers on every page and API response (a content security policy, no framing, no content sniffing) and per-visitor rate limits on the API.
- Operator-triggered expired-run cleanup. It deletes stored files before releasing their SQL quota.

There are no real invitations, email sending, invoices, contracts, payments or runtime AI calls. The first-jobs list is a deterministic suggestion for human review. The API also has request and comment endpoints from the earlier form interface; the conversation interface does not use them.

## Run locally

Requires Git and Node.js 22.13 or newer. I run it on Node 26.6.0. Use the lockfile:

```sh
npm run install:ci
npm run build
```

For a fresh local database, apply the three migrations once, in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_premium_gravity.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_acoustic_hannibal_king.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_yielding_warhawk.sql
npm run dev -- --port 5179
```

Use the loopback URL printed by the server. Do not replay migrations already applied. `.wrangler/state` holds local data; the test runner uses separate disposable state. `npm start -- --port 5180` previews the built Worker.

## Deploy

The demo is one Cloudflare Worker with one D1 database, both on the free plan. `vite.config.ts` names the Worker and the database. To publish a separate copy, sign in with Wrangler, create your own D1 database, put its ID in `vite.config.ts` and apply the three migrations with `--remote` in place of `--local --persist-to .wrangler/state`. Then:

```sh
npm run build
npm run deploy
```

Set `DEMO_ADMIN_TOKEN` as a Worker secret before running cleanup; see [operator instructions](docs/operator.md).

## Verify

```sh
npm run typecheck
npm run build
npm test
```

The current suite contains 35 unit, storage-fault, client and conversation checks plus 16 real Worker API checks. The API runner applies all migrations to disposable local D1 state. It checks access boundaries, invalid inputs, conflicting saves/approvals, safe retries, upload failure recovery, reset and cleanup. See [observed results and limits](docs/verification.md).

## Follow the data

```mermaid
flowchart LR
  UI[React conversation and seat switch] --> API[Worker API: session, CSRF, membership]
  API --> RULES[Validation and readiness rules]
  RULES --> SQL[(D1: versions, requests, approvals, events)]
  API --> FILES[(D1: private file bytes)]
  SQL --> VIEW[Current draft and separate accepted version]
  VIEW --> UI
```

Start with [the learner's walkthrough](docs/how-it-works.md), then [the code graph guide](docs/code-graph.md). Graphify is an optional local developer tool; `npm run graph` refreshes its AST graph without model calls or code upload. SQL-string relationships still need source inspection. Read [decisions](docs/decisions.md), [issues](docs/issues.md), [the design notes](DESIGN.md) and [operator instructions](docs/operator.md) for maintenance.

## Limits, and how I built it

The public demo stores at most 20 runs, including expired runs until cleanup. Each visitor's address is limited to 240 API requests a minute and 6 demo starts a minute, which slows abuse but does not stop a determined one from filling the 20 slots. Cleanup is manual. An interrupted upload can leave a durable write claim that requires operator investigation; capacity stays reserved until it is safely repaired. An answer that has not been sent lives in memory, not durable browser storage. Uploaded files receive size, type and signature checks, not malware scanning. A file can be at most 1.9 MB because its bytes are stored in a D1 row.

I built this project using AI coding assistants as tools: GPT/Codex for the first version, and Claude for the November 2026 work, which covers the reliability fixes, the move to Cloudflare and the conversation interface that replaced the original form. I set the scope, chose the stack and the visual direction, and directed and reviewed the work. The assistants generated most of the implementation, tests and documentation, and I used AI review passes to check the design and the code. I also made one guided code change myself: the deadline reminder and its two tests. I ran the checks and confirmed the result on screen and in the downloaded handoff. I did not write every line unaided. My predictions from that exercise are in [learning](docs/learning.md), and [decisions](docs/decisions.md) has the reasoning behind the main choices.

Third-party notices are in [ATTRIBUTION.md](ATTRIBUTION.md) and the licence files it points to. I have not chosen a licence for my own code yet. I used no Halvern client material and none of Quin's code.
