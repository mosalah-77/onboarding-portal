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
