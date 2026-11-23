# Verification

Author: Mohamed Elmorshedy

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
- The public repository is `mosalah-77/onboarding-portal`. Licences are preserved.

## Guided deadline reminder, 8 November 2026

- Mohamed added a test that first failed because the blank deadline produced no task. After his edit to `checklist`, the reminder test passed. His second test confirms that an entered date keeps exactly one requested-date task.
- Mohamed ran all 32 unit/fault/client checks and `npm run typecheck`; both passed. He confirmed the local browser shows “Not agreed” beside the scheduling reminder and that the downloaded handoff contains the reminder. These manual observations were reported by Mohamed.
- The change does not alter readiness, database schema, stored brief facts, permissions or asset handling. The two new cases exercise the checklist rule; the existing approval test covers handoff facts after reopening.
- The 32 unit/fault/client checks and type check were rerun after formatting the edit; both passed. The Sites production build also passed. The 15 Worker API checks last passed with the prior release; they were not rerun for this checklist-only change.
- Sites version history records the production deployment. Roll back to Sites version 2 if the new handoff fails after deployment. No data rollback is required.

## Interface pass, 23 November 2026

- Baseline before any change: 32 unit/fault/client checks and 15 Worker API checks passed on the published `main`.
- The lost-response API test now sends a retry key with surrounding whitespace. With the old `lib/workflow.ts` it failed (the retry returned 409); with the fix it passes.
- After the changes: `npm run typecheck`, `npm run lint` (no errors or warnings), the Sites production build, 32 unit/fault/client checks and 15 Worker API checks passed.
- Watched in a local Chromium browser at 1440×900 against the dev server: welcome → start demo → enter audience → save → submit version 2 → "Continue as agency owner" → approve → approved handoff and checklist. Also the start-over dialog, an owner-created required request on Client B, and `/how-it-works`. No page errors; the only console error was the expected 401 from the first session probe.
- At 390px the approved workspace had no horizontal overflow (document width equalled the viewport).
- With reduced motion emulated in the same browser, the entrance animation computed to `none`, button transitions to 0s and scrolling to `auto`.
- Not checked: the hosted site (nothing was deployed), Firefox, and the reduced-transparency path, which was reviewed in source only.

### Intermittent API failure

- Before the fix the API suite failed 1 run in 14, then 1 in 35, then 1 in 9, each time with a 503 on the reset or cleanup call that followed a deliberately rejected request.
- The 503 body was Wrangler's "Your worker restarted mid-request", not the application's JSON error.
- Reproduced directly against the local Worker: 1,500 authorised cleanup calls gave no failure; the same calls each preceded by a 401 whose body was never read gave 4 failures in 3,000. Cancelling the unread body still failed (3 in 6,000). Reading it to the end gave 0 in 9,000, and the bounded streaming version that shipped gave 0 in 9,000.
- With the fix the API suite passed 40 of 40 consecutive runs. This message comes from the local development proxy; whether production ever behaves the same way was not tested.

### Browsers, zoom and viewports

- Safari itself could not be inspected without taking over the screen, so Playwright's WebKit build stood in for it. WebKit (1440×900, iPhone 14 and iPad profiles) and Chromium each completed welcome → save → submit → switch to owner → approve → handoff, opened and closed the start-over dialog with Escape, and loaded the guide, with no page errors and no horizontal overflow.
- WebKit showed the dropdown shorter than the other fields; it now matches. No other rendering difference was seen.
- No horizontal overflow at 18 widths from 320px to 1920px on the approved workspace and the guide, or at 10 widths on a draft workspace and the welcome screen.
- 200% and 400% zoom were emulated as 720×450 and 360×225 windows: no horizontal overflow, and the bar and rail scroll away instead of staying pinned. Browser zoom itself was not used.
- axe-core (WCAG 2.0, 2.1 and 2.2 A and AA rules) ran on five states in each of the four profiles. It found one contrast failure, the "Portfolio demo" label over scrolled content on iPhone; the label is darker and the bar less transparent now, and the rerun found nothing.
- Keyboard: tab order in WebKit and Chromium runs through the guide link, the three role buttons, the project, the page links and "Start over" before the content, each with a visible outline. Switching role with Enter moves focus to the project heading.
- No screen reader was run. The axe results and the heading and focus checks above cover names, roles and labels only; they do not show how VoiceOver reads the page.

### Light and dark mode

- Chromium, WebKit and the iPhone 14 profile each ran the full approval flow twice, once with the system set to light and once to dark. The matching theme was already applied when the page first rendered, the button switched it, and the choice survived a reload. No page errors.
- axe-core found no WCAG A/AA failures in either mode on the welcome screen, draft workspace, ready-to-submit state, approved workspace, confirmation dialog or guide, in all three profiles.
- `app/globals.css` holds no literal color outside the two token blocks.
- Not checked: the error summary and the loading placeholder in dark mode were not captured, and no person has compared the palettes on a real phone screen.

## Cloudflare hosting, 23 November 2026

- Public URL: https://client-brief.mosalah-77.workers.dev
- After moving file bytes to D1 and removing the starter's hosting code: `npm run typecheck`, `npm run lint`, the production build, 32 unit/fault/client checks and 15 Worker API checks passed. The API suite now uploads and downloads a file of exactly 1,900,000 bytes and expects 413 for one byte more.
- The three migrations were applied to the remote D1 database and the Worker was deployed with `npm run deploy`.
- Against the public URL: two separate visitors each started a demo, and one visitor's request for the other's project returned 404. A 1,900,000-byte PNG uploaded and came back byte for byte; 1,900,001 bytes returned 413. The second visitor's request for the first visitor's file returned 404. A wrong CSRF token returned 403. Cleanup without the operator token returned 401; an earlier run on the same day with the token returned 200.
- In Chromium against the public URL, the flow from welcome to approved handoff completed in light and in dark mode with no page errors. The guide page served the updated storage text.
- The test runs and their files were deleted from the remote database afterwards; it held no runs when this was written.
- Not checked: behaviour at the free plan's daily request and storage limits, and the hosted site in WebKit or on a real phone.
- The earlier entries on this page that mention Sites describe the previous host.
