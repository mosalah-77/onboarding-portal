# Verification

Author: GPT/Codex

## Task 1, 8 November 2026

- Rule test first failed because the implementation was absent; the real API first returned 404 for demo creation.
- `npm test`: 6 rule tests and 8 real Worker API tests passed, including cross-client/cross-run access, concurrent saves, idempotent retry, CSRF and final-capacity contention.
- `npm run typecheck`: passed. Sites production build: passed.
- The API runner creates disposable local D1/R2 state and removes it after the run.
- No UI or hosted verification yet.

## Task 2, 8 November 2026

- New tests first failed on unresolved automatic requests and missing request routes.
- `npm test`: 6 rule tests and 10 real Worker API tests passed. Added request/comment retries, stable automatic request IDs, required and optional requests, owner permissions and exact-revision submission.
- Type checking and Sites production build passed.
- No UI or hosted verification yet.

## Task 3, 8 November 2026

- File tests first failed on the missing upload module; the real upload route returned 415 instead of success.
- Full suite: 12 unit/fault tests and 11 real Worker API tests passed. Type checking and Sites production build passed.
- Checks cover incorrect file labels/bytes, control characters, streamed size limits, storage and SQL failure recovery, pending quota reservations, competing quota claims, private downloads, cross-client/cross-run denial and attachment scope.
- Mohamed predicted that an exact Client B file URL would still deny Client A. The real API returned 404, as expected.

## Task 4, 8 November 2026

- Approval tests first failed because the exports/routes did not exist.
- Full suite: 14 unit/fault tests and 14 real Worker API tests passed. Type checking and Sites production build passed.
- Verified owner-only approval, exact submitted revision, duplicate approval retry, reopen reason, preserved accepted facts, save/approval and request/approval races, and zero-row transaction rollback without dependent records.
- The graph refresh command passed its nonempty graph, relationship endpoint and core-source checks; it writes source hashes with each snapshot.

## Browser workflow and lifecycle, 8 November 2026

- Full suite: 25 unit/fault/client checks and 15 real Worker API checks passed. Type checking and the Sites production build passed.
- New cleanup tests first failed on the absent module, then passed. They cover expired-session denial, operator authentication, partial deletion retry, concurrent upload claims, isolated reset and bounded stored runs. The API suite verifies reset and operator cleanup against the built Worker.
- The browser completed incomplete brief → save → submit → owner approve → reopen. A cross-client URL returned a focused denial. Two tabs produced one success and one conflict while preserving the losing text; loading latest and saving the reviewed edit worked.
- Stopping and restarting the owned preview server exercised a real failed save and safe retry. A synthetic file uploaded through the browser. Unsent request comments trigger the leave warning; cancelling preserves them, and successful posting clears the draft.
- A duplicate page name produced a server 422 and an inline field error associated with its input. The suggested handoff checklist includes responsive/accessibility review in both the page and downloaded text.
- Desktop, 390px and 350px layouts, intermediate reflow, keyboard focus, dialog defaults and DOM reading order were checked. Actual Chrome zoom at 200% reported a 674px viewport with no horizontal overflow; the capture tool's malformed zoom image was excluded. This is not a full screen-reader or cross-browser audit.
- The independent Impeccable reviewer scored all four requested fixes resolved and returned a scoped ship verdict. See `design-review.md`. The automated Impeccable detector could not run because its launcher lacked execution permission; manual and independent review supplied the design checks.
- A temporary loopback proxy held the first Client A project response for 20 seconds. Project/persona/reset controls were disabled during loading. After navigation through the brand link and selection of Client B, the old response was released to a closed downstream connection; Client B’s heading, selected project and unsaved goal remained intact. This verifies navigation cancellation and draft preservation, not every internal generation-guard branch. The temporary proxy and tab were closed. Hosted verification was subsequently completed below.

- Following the button-state correction, typecheck, production build and 25 unit/fault/client checks passed again. The API runner initially hit the sandbox's loopback-bind restriction; the permitted loopback rerun passed all 15 checks. No application test failed.

## Final code review and corrections

- Independent whole-branch review found no Critical findings and two Important findings. A clean editor could display old fields beside a newer revision number; an overlapping identical retry could receive 409 despite the original operation succeeding.
- Four regressions failed before correction: clean-editor reconciliation, and overlapping identical save, comment and request operations. After correction all passed. A separate test preserves genuinely unsaved edits and requires explicit reconciliation against the new revision.
- Final full suite: **30 unit/fault/client + 15 real Worker API checks passed**. Typecheck and production build passed. The concurrency regression controls transaction timing while executing real SQLite and the production workflow functions.
- Two browser tabs verified the editor correction: tab B saved/submitted version 4; tab A's comment response refreshed its clean fields to version 4 before approval. With tab A dirty, another response containing version 5 preserved its input, named the stale version and disabled approval. Loading latest kept that input; saving created version 6.
- The independent design documenter produced and parsed DESIGN.md and `.impeccable/design.json`, checked the 15 palette values against CSS and validated component preview structure. The later stale-edit notice reuses existing notice/button styles; no token changed.
- Secret-pattern scans of tracked source and historical file objects found no matching credentials. The private operator token is ignored by Git and configured as a server-only Sites secret. Referenced third-party licence files are present.
- Deferred minor: directly supplied operation keys with surrounding whitespace do not replay consistently. The UI emits canonical UUID keys (and digest keys for files), so its retry path is unaffected. There is no public integration API commitment in this version.

## Hosted release, 8 November 2026

- Public URL: https://elmorshedy-onboarding-demo.m-elmorshedy635.chatgpt.site
- Sites deployment of reviewed application commit `6d3fe865cb4785e36b87d8fc4db66a87089180b6` succeeded with runtime secret revision 1; this new Site was then made public as requested.
- Missing required audience blocks submission with 422.
- Private R2 upload/download works; cross-client project/file and cross-run project requests return 404.
- Overlapping identical saves and comments return one successful operation; optional blanks remain valid.
- Client approval denied; owner approves exact version and receives checklist; reopening preserves accepted scope.
- Reset isolates the replacement run; operator cleanup deletes expired test bytes and preserves another active visitor.
- The deployed browser completed missing input → saved version 2 → submission → owner approval → accepted checklist. Desktop and 390px mobile were inspected; mobile document width equalled its 390px viewport. No current hosted error appeared in the captured console log; older localhost HMR errors were excluded by timestamp and origin.
- The first API verification attempt failed because its temporary cookie jar overwrote the application cookie with Cloudflare's `__cf_bm` cookie. Preserving both cookies fixed the harness; the complete hosted check then passed. Browser cookies needed no change.
- No public capacity-exhaustion test was run. The full capacity/contention tests use disposable local storage.
- The public repository is `mosalah-77/onboarding-portal`. Publication retains the reviewed source trees and commit-sized changes, uses Mohamed's account metadata without an AI co-author, and preserves the AI-use notes and licences. The original local AI-authored history remains on the implementation branch.

## Guided deadline reminder, 8 November 2026

- Mohamed added a test that first failed because the blank deadline produced no task. After his edit to `checklist`, the reminder test passed. His second test confirms that an entered date keeps exactly one requested-date task.
- Mohamed ran all 32 unit/fault/client checks and `npm run typecheck`; both passed. He confirmed the local browser shows “Not agreed” beside the scheduling reminder and that the downloaded handoff contains the reminder. These manual observations were reported by Mohamed.
- The change does not alter readiness, database schema, stored brief facts, permissions or asset handling. The two new cases exercise the checklist rule; the existing approval test covers handoff facts after reopening.
- GPT/Codex reran the 32 unit/fault/client checks and type check after formatting the edit; both passed. The Sites production build also passed. The 15 Worker API checks last passed with the prior release; they were not rerun for this checklist-only change.
- Sites version history records the production deployment. Roll back to Sites version 2 if the new handoff fails after deployment. No data rollback is required.
