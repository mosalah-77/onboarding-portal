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
- A deliberately delayed old-response browser scenario and hosted verification remain pending. The load-generation guard was inspected in source; it is not presented as an executed browser test.

- Following the button-state correction, typecheck, production build and 25 unit/fault/client checks passed again. The API runner initially hit the sandbox's loopback-bind restriction; the permitted loopback rerun passed all 15 checks. No application test failed.
