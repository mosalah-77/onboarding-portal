# Onboarding portal implementation plan

> For agentic workers: use `superpowers:executing-plans` for native execution or `superpowers:subagent-driven-development` if Mohamed chooses delegation. Implement and check one task at a time. Checkboxes record completed work, not intentions.

Author: GPT/Codex
Date: 8 November 2026
Status: Approved by Mohamed on 8 November 2026; native execution in progress.

Goal: deliver an independent portfolio demo with a real saved brief, controlled approval, a useful handoff and tested client isolation.

Architecture: a fresh Sites/Vinext application with React/TypeScript, backend routes, D1 records and private R2 assets. The backend resolves an opaque demo session, checks membership and performs conditional database mutations. Each approval names an immutable brief revision.

Tech stack: the supplied Sites starter, its existing Drizzle and Zod dependencies, and Node's test runner. Use Wrangler's local D1/R2 runtime for integration tests. Explain any necessary new dependency before adding it.

Spec: [approved design](../specs/2026-11-08-onboarding-portal-design.md).

Recommended execution: native, in this chat, with an independent review after implementation. The session, workflow and file-handling code share transaction rules; keeping implementation together makes those decisions easier for Mohamed to follow. Keep the learning checkpoints requested in the brief.

## Global constraints

- Use a new project directory, `/Users/moe/Desktop/Halvern/onboarding-portal`, after approval. Do not clone or edit the company repositories.
- Maintain the user-selected Sites stack. Initialise from the installed Sites starter; preserve the build integration and its attribution.
- Keep the app visibly labelled as an independent portfolio demo with synthetic data. Treat identity switching as simulated.
- Required brief values: goal and audience, each at most 2,000 characters; one to ten distinct page names, each at most 80 characters; and an asset plan. Constraints and requested deadline are optional.
- File limits: PNG/JPEG/PDF, 2 MiB each, five ready files per project, 20 MiB per run. Reservations count toward quota while pending.
- Runs expire after 24 hours. Enforce 20 active runs and 200 MiB stored globally. Failed cleanup does not release storage accounting.
- Every private lookup checks run/workspace membership; every mutation also checks its role and expected project token. Check same origin for all writes and session-bound CSRF after a demo session exists.
- No paid-service enrolment, acceptance of new terms, external messages, company data or secrets in source.
- Use Impeccable for UI work, Humanizer for public text, test-driven development for behaviour, and security/verification skills before release. Read each applicable skill when its work begins.
- Record actual test output, decisions, issues and authorship. Do not fabricate Mohamed's explanations, edits or results.

## Review focus

1. A submitted brief changes while its owner approves it: one transition wins and the other receives 409; test in Task 4.
2. An operation commits but its HTTP response is lost: a retry returns the same result without another comment, request or revision; test in Tasks 1 and 2.
3. An upload passes storage but fails metadata finalisation: a retry reconciles the same asset and quota; test in Task 3.
4. A late browser response arrives after a persona or project switch: never render the earlier project's data or discard an unsaved draft; test in Task 5.
5. Two visitors reserve the final run or upload capacity concurrently: the database admits only what fits; test in Tasks 1 and 3.

## File responsibilities

Paths below are relative to the future project root.

| Files | Responsibility |
| --- | --- |
| `.openai/hosting.json`, `cloudflare-env.d.ts` | New Site identity and `DB`/`BUCKET` bindings; no credentials |
| `db/schema.ts`, `drizzle/` | Scoped relational records, constraints and immutable schema-only migrations |
| `lib/brief.ts` | Brief types, deterministic validation, readiness and accepted-brief checklist |
| `lib/session.ts` | Demo session, seed data, CSRF and membership checks |
| `lib/workflow.ts` | Saved revisions, requests, comments, idempotency and state transitions |
| `lib/assets.ts` | Bounded upload, quotas, private download and upload reconciliation |
| `lib/http.ts`, `app/api/portal/[...path]/route.ts` | HTTP validation, route dispatch, safe errors and binding access |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Entry surface, metadata and original responsive styles |
| `components/portal.tsx`, `components/brief-editor.tsx`, `components/requests.tsx`, `components/handoff.tsx` | Queue/personas, editor/history, request discussion and accepted handoff |
| `tests/brief.test.mjs`, `tests/api.test.mjs`, `tests/assets.test.mjs`, `tests/fixtures/` | Rule, real API and fault-recovery evidence using synthetic fixtures |
| `scripts/test-api.mjs`, `scripts/cleanup-demo.mjs` | Dedicated local integration runtime and authenticated operator cleanup |
| `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `docs/surface.md` | Product facts, UI tokens and Impeccable's surface/review records |
| `docs/decisions.md`, `docs/issues.md`, `docs/learning.md`, `docs/verification.md`, `README.md`, `ATTRIBUTION.md` | Decisions, evidence, learning and reproducible public documentation |

## Shared interfaces

Define these in the owning files; do not create a separate abstraction package.

`lib/brief.ts` owns:

```ts
type BriefInput = {
  goal: string; audience: string; pages: string[]; constraints: string;
  assetPlan: "supplied" | "create"; deadline: string | null; assetIds: string[];
};
type Blocker = { key: string; field: keyof BriefInput; message: string };
type ProjectToken = number;
type ChecklistItem = { text: string; fact: keyof BriefInput };
function validateBrief(input: unknown): BriefInput; // 422 for malformed/oversized values; incomplete drafts allowed
function readiness(brief: BriefInput, readyAssetIds: Set<string>): Blocker[];
function checklist(accepted: BriefInput): ChecklistItem[];
```

`lib/session.ts` owns `ActorContext = { sessionId: string; runId: string; personaId: string; workspaceIds: string[]; role: "client" | "owner" }` and `requireActor(request: Request, db: D1Database): Promise<ActorContext>`.

`lib/http.ts` owns `PortalEnv = { DB: D1Database; BUCKET: R2Bucket; DEMO_ADMIN_TOKEN?: string }` and `handlePortalRequest(request: Request, env: PortalEnv): Promise<Response>`. The route adapter supplies real bindings. Fault tests may pass failing storage bindings directly; production exposes no failure-injection route.

`lib/workflow.ts` owns `ProjectView`, containing project ID/state/token, latest/submitted/accepted revisions, assets, requests/comments and activity. Its public functions return `ProjectView` or an explicit operation receipt; all take `ActorContext` and scope their queries.

Expose these HTTP operations under `/api/portal`:

| Method and path | Input/result |
| --- | --- |
| `POST /demo` | Same-origin JSON request starts one isolated run and sets its session cookie |
| `GET /session` | Current persona, permitted projects and session CSRF token; no other visitor's data |
| `POST /persona` | A persona belonging to the current run |
| `GET /projects/:id` | Authorised `ProjectView` |
| `POST /projects/:id/revisions` | `BriefInput`, expected token, idempotency key |
| `POST /projects/:id/submit` | Exact revision ID, expected token, idempotency key |
| `POST /projects/:id/requests` | Owner's title/explanation/blocking flag, expected token, idempotency key |
| `POST /requests/:id/comments` | Comment text and idempotency key; membership comes from the request's project |
| `POST /requests/:id/resolve` | Owner's explanation, expected token, idempotency key |
| `POST /projects/:id/assets` | Bounded bytes, type/name and upload operation key |
| `GET /assets/:id` | Checked private attachment download |
| `POST /projects/:id/approve` | Submitted revision ID, expected token, idempotency key |
| `POST /projects/:id/reopen` | Non-blank reason, expected token, idempotency key |
| `POST /demo/reset` | Expires only this run and starts a fresh one within capacity |
| `POST /admin/cleanup` | Bearer operator token; rejects when token is absent or invalid |

Return structured 422 field errors, 409 conflicts, 413 size errors and 429 capacity errors. Use the same 404 response for absent and unauthorised objects. No internal SQL, keys or stack traces in public errors.

## Task 1: save an isolated synthetic brief

Files: starter/config/schema, `lib/brief.ts`, `lib/session.ts`, revision/read portions of `lib/workflow.ts` and `lib/http.ts`, route adapter, tests and logs.

Interfaces: produce `BriefInput`, `readiness`, `ActorContext`, `ProjectView`, and `saveRevision(db, actor, projectId, expectedToken, key, brief): Promise<ProjectView>`. Later tasks consume these exact types and functions.

- [x] After confirmation, initialise the fresh starter using Sites' `project-setup.mjs`; start the single supported dependency install. Register the new private, unpublished Site once and persist its returned ID. Retain its credential only in session memory.
- [x] Move the approved spec/plan into `docs/superpowers/`, create the logs, and record `Author: GPT/Codex`. Create `PRODUCT.md` from confirmed facts using Impeccable's product schema. Preserve starter licence files.
- [x] Write failing rule tests: `assert.deepEqual(readiness(validWithBlankOptionals, new Set()), [])`; blank audience yields only `audience.required`; duplicate trimmed/case-insensitive page names fail validation; an invalid calendar date fails; a valid past requested date is preserved.
- [x] Ask Mohamed to predict the blank-optional-field result before running it. Record his actual answer, or leave the learning item pending if he has not answered.
- [x] Run `node --experimental-strip-types --test tests/brief.test.mjs`; confirm failure is missing behaviour, not a syntax/setup problem.
- [x] Implement brief parsing and readiness. Add the scoped schema and generate/inspect migrations with `npm run db:generate`; seed data stays outside migrations. Use only immutable revision inserts.
- [x] Add real-route tests in `tests/api.test.mjs`: two runs have disjoint IDs; Client A cannot GET B's project; two saves with one expected token have statuses `[200, 409]`; retrying a completed save returns the same revision; mismatched data with the same key returns 409; the 21st active run is rejected, including a race for the final slot.
- [x] Implement session creation, persona selection, membership, CSRF for established sessions and conditional saved revisions. Initial demo creation requires a matching Origin and a custom same-origin request header; do not create an exception for later writes.
- [x] Add `scripts/test-api.mjs`: start the built Worker on loopback with isolated disposable D1/R2 state, apply migrations, run Node's API tests, stop the server and remove only that test state. It must reject non-loopback test targets. Give it `node scripts/test-api.mjs` as the entry point.
- [x] Run unit tests, `npx tsc --noEmit`, the Sites `build-site.mjs` helper and `node scripts/test-api.mjs`. Record the actual results, then commit this working backend slice.

## Task 2: requests, comments and submission

Files: request/comment schema if not already included, workflow/http modules, `tests/api.test.mjs`, logs.

Interfaces: consume Task 1; add `submitBrief(db, actor, projectId, revisionId, expectedToken, key)`, `createRequest(db, actor, projectId, input, expectedToken, key)`, `commentOnRequest(db, actor, requestId, text, key)` and `resolveRequest(db, actor, requestId, explanation, expectedToken, key)`. Project mutations return `ProjectView`; comments return their persisted ID and text.

- [x] Write failing API tests: saving the same missing audience twice leaves one automatic request; filling it resolves that request; clearing it reopens the same ID and preserves its comments. Repeated submit/comment/manual-request calls produce one operation and one activity event each.
- [x] Add tests that required manual requests block submission, optional requests do not, and a client cannot create or resolve owner-controlled requests. Reject blank comments and resolutions; cap comment/explanation text at 2,000 characters and request titles at 160.
- [x] Run `node scripts/test-api.mjs` and verify the new behaviour fails as expected.
- [x] Implement stable automatic rule keys, request-specific comments, owner resolution and exact-revision submission. Use a common scoped receipt for idempotent mutations. A mutation's state changes, receipt and activity must commit together.
- [x] Re-run API tests and type checking, update logs and commit. Explain the request's input, storage row and retry result at the second learning checkpoint.

## Task 3: private files and upload recovery

Files: asset/quota schema, `lib/assets.ts`, asset routes, fixture files, `tests/assets.test.mjs`, API tests and logs.

Interfaces: `uploadAsset(env, actor, projectId, operationKey, filename, contentType, body): Promise<AssetView>` and `downloadAsset(env, actor, assetId): Promise<Response>`. `AssetView` contains ID/name/size/status, never a public storage key. Type `body` as `ReadableStream<Uint8Array>` and enforce its byte limit while reading.

- [ ] Write failing tests for unsupported bytes/extensions, false MIME labels, 2 MiB plus one byte, a Client A download of B's asset, a second-run download and a missing object behind otherwise-ready metadata.
- [ ] Add fault tests for storage failure and SQL finalisation failure after storage succeeds; assert the saved brief is unchanged and a retry yields one asset and one reservation. Replay with different bytes under the same key must fail.
- [ ] Add parallel-quota tests: pending reservations count; only one upload wins the last slot/remaining byte budget. Scope five-file limits to a project and aggregate byte limits to run/global storage.
- [ ] Run `node --experimental-strip-types --test tests/assets.test.mjs` and the API suite; inspect the expected failures.
- [ ] Implement reservation, validated bytes, conditional immutable object write and ready finalisation. Keep pending objects discoverable by their operation identity for retry. Retain approved asset bytes unchanged.
- [ ] Add a harmless generated PNG fixture for each client's own project, with no copied brand asset. Verify private downloads use attachment and nosniff headers and filenames cannot inject headers.
- [ ] Re-run fault and real API tests, type checking and build. Ask Mohamed to predict the cross-client file request before that learning test; record the result and commit.

## Task 4: approve a revision and derive its handoff

Files: approval/history schema, workflow/brief/http modules, rule/API tests and logs.

Interfaces: `approveBrief(db, actor, projectId, revisionId, expectedToken, key): Promise<ProjectView>`, `reopenBrief(db, actor, projectId, reason, expectedToken, key): Promise<ProjectView>` and Task 1's `checklist(accepted)`.

- [ ] Write failing tests: incomplete or stale revisions cannot be approved; a client approval fails; saving an approved project fails until owner reopening; blank reopen reason fails; reopening preserves the accepted revision and records its reason.
- [ ] Add races: two saves from the same token; save versus approval; required request creation versus approval. Assert exactly one eligible transition commits, with no partial approval/activity/receipt. Test that a zero-row conditional write cannot leave dependent records.
- [ ] Add handoff assertions: it uses the accepted revision's pages/assets/deadline even after a newer draft exists; a page checklist item refers to the accepted `pages` fact; a blank deadline remains “Not agreed”.
- [ ] Ask Mohamed for his race prediction, then run the API/unit suites and confirm the expected failures.
- [ ] Implement approval/reopen transactions and the derived handoff. Do not update historical revisions or approvals. Required request changes must invalidate the project concurrency token.
- [ ] Re-run suites, type check and build; record evidence and commit.

## Task 5: usable client and agency screens

Files: page/layout/styles, the four components, `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `docs/surface.md` and browser evidence.

Interfaces: consume the real API and `ProjectView`; all accepted-scope UI consumes the accepted revision. A shared request function preserves operation keys across retries and decodes the existing structured errors.

- [ ] Read the applicable Impeccable new-work/Operate guidance and craft floor before UI edits. Reuse the confirmed product brief and any approved design direction. Use its documented fallback if the launcher remains unavailable; do not change system permissions to run it.
- [ ] Build a task-oriented editor: project/revision/status header, labelled brief fields, blocker summary, requests/comments and activity. The agency queue shows both permitted projects and unresolved required requests. Show the selected demo persona persistently.
- [ ] Make buttons name the consequence: “Save draft”, “Submit version 2”, “Approve version 2” and “Reopen brief”. Handle load/empty/error/pending/success states with visible status text and keyboard focus.
- [ ] Preserve unsaved form values after conflicts and network failures. Require an explicit discard decision before changing project/persona with unsaved changes. Cancel or ignore stale responses after navigation; verify a delayed old response cannot replace the current view.
- [ ] Add the accepted handoff/checklist and revision history with accessible fact links. Treat any newer draft as awaiting review. Keep deadline copy a request, never an agreed delivery promise.
- [ ] Run Humanizer in embedded mode over UI text, metadata, seed copy and documentation. Preserve every rule, number and evidence claim; write only text supported by the current implementation.
- [ ] Start the verified local preview, open it in the supported browser and inspect desktop/390 px layouts, 200% zoom, keyboard traversal, inline errors, focus after transitions and reduced motion. Fix observed issues in a batch and record evidence.
- [ ] Complete Impeccable's applicable rendered review and token documentation, with an independent reviewer where the skill requires one. Re-run the behaviour checks affected by any corrections, then commit.

## Task 6: cleanup, public release and portfolio evidence

Files: cleanup/session/HTTP modules, operator script, tests, README, attribution, learning and verification docs, hosting metadata.

Interfaces: `cleanupExpiredRuns(env, limit): Promise<{ runsRemoved: number; assetsRemoved: number }>` accepts a bounded batch limit; only an operator-authenticated route or trusted local test may invoke it. No browser bundle receives `DEMO_ADMIN_TOKEN`.

- [ ] Write failing tests for expired sessions, invalid operator tokens, partially failed cleanup, reset of only the current run, full capacity and concurrent cleanup/retry. Keep objects/rows accounted for until confirmed deleted.
- [ ] Implement bounded, repeatable operator cleanup and a script using an environment-provided token. Use constant-time token comparison where supported. Document the operator trigger; do not enrol an external scheduling service.
- [ ] Run all unit/API/fault suites, type check and a production build. Review the changed server/SQL code with the relevant installed security review skill. Resolve material findings and rerun affected checks.
- [ ] Have Mohamed make the agreed small rule/checklist change himself and explain the test. Record only what he actually did. If pending, report the learning contribution as unfinished.
- [ ] Write the reproducible README, architecture/data flow, 90-second demo script, known limitations, contribution/AI-use note and attribution. Mark every feature working, simulated or future. Apply Humanizer to the final public prose.
- [ ] Scan the intended source for secrets and private material. Keep runtime state, uploads, test data stores, credentials and generated archives out of Git. Verify small commits identify AI work accurately.
- [ ] Package and push the exact source using the Sites workflow helper. Save/deploy through the appropriate native tool, then set this new Site's audience to public as requested in the original brief. Never change a different Site's audience or send viewer invitations.
- [ ] Wait for the deployment's terminal success, then exercise the hosted workflow and cross-client/cross-run access checks in disposable demo runs. Keep a failed hosted check open rather than reporting completion from local tests.
- [ ] Identify Mohamed's intended personal GitHub destination before publishing there; connected Sites source storage is not automatically his portfolio GitHub. Preserve licences and author history when publishing the reviewed source.
- [ ] Run the verification-before-completion skill and report the public URL, repo, observed test results and remaining limits. Stop the owned local preview process.

## Self-review

The six tasks cover the requested workflow, server-enforced client/file isolation, duplicate and concurrency behaviour, upload recovery, mobile/accessibility checks, public deployment and learning evidence. The review-focus cases each have an owning test step. Interfaces use the same revision/state token and scoped actor throughout.

Mohamed approved the design and native execution on 8 November 2026. The personal GitHub destination can be resolved before publication without blocking local implementation.
