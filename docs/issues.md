# Issues

Author: Mohamed Elmorshedy. Updated 24 November 2026.

- Resolved: Mohamed completed the guided deadline-reminder variation, its tests and local screen/download checks. See `learning.md` for the contribution record and `how-it-works.md` for its data flow.
- Release: the public deployment and hosted workflow/access checks passed. Source publication uses the existing GitHub SSH identity; see the repository and verification record.
- Resolved: both Important final-review findings; regression tests first failed, then passed with the full 45-check suite. See verification.md.
- Resolved 23 November 2026: retry keys supplied with surrounding whitespace now replay. The lost-response API test sends a padded key; it failed before the fix and passes after.
- Resolved 23 November 2026: `npm run lint` is clean. The guide's home links use `next/link`; the workspace brand is plain text because it only pointed at the page it sits on.
- Resolved 24 November 2026: the stale `.impeccable/design.json` was deleted with the old interface. `DESIGN.md` is the design record.
- Verified: a delayed GET released after leaving its page did not replace the new project or its unsaved goal. Navigation controls were disabled during the held load; the generation guard itself is also inspected in source.
- Known limit: an abruptly interrupted upload can leave a durable write claim requiring operator investigation. Capacity stays reserved.
- Known limit: no per-IP throttling or automated cleanup; stored runs are capped at 20.
- Impeccable launcher and detector could not execute; manual fallback and independent rendered review were used.
- Resolved: unsent request comments now trigger navigation protection; cancelling keeps them, successful posting clears them.
- Resolved: success status receives focus; a reopened accepted version asks for a new save; server errors are associated with fields; mobile reading order and dark-rail focus were corrected and reviewed.
- Resolved in source: discard-button hover/active and primary active states retain readable foreground/background colours after the documenter found a CSS specificity conflict.
- Resolved 23 November 2026: the API suite failed about once in fifteen local runs with a 503 on reset or cleanup. Cause: when the server rejected a request (401 or 403) before reading its body, local Wrangler sometimes answered the next request with "Your worker restarted mid-request". The server now reads and drops an unread body before replying. See verification for the numbers.
- Known limit: no real Safari, VoiceOver or other screen reader session has been run. See verification for what stood in for them.
- Entries above that mention the form, the next-step card, request comments or navigation protection describe the interface that was replaced on 24 November 2026.
- Open: the hosted site has not been redeployed with the conversation interface.
- Known limit: a skipped optional question is remembered for the page only. After a reload it is asked again until the brief has been sent once.
- Known limit: an answer being typed is lost if the visitor switches seat or reloads before sending it.
- Known limit: the new screens have had no automated accessibility scan and no screen reader session.
- Known limit: the starter's unused UI primitives and their dependencies are still in the repository.
