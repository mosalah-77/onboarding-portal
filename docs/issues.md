# Issues

Author: GPT/Codex. Updated 8 November 2026.

- Resolved: Mohamed completed the guided deadline-reminder variation, its tests and local screen/download checks. See `learning.md` for the contribution record and `how-it-works.md` for its data flow.
- Release: the public deployment and hosted workflow/access checks passed. Source publication uses the existing GitHub SSH identity; see the repository and verification record.
- Resolved: both Important final-review findings; regression tests first failed, then passed with the full 45-check suite. See verification.md.
- Deferred minor: retry keys supplied directly to the API with surrounding whitespace do not replay consistently. Browser-generated keys are unaffected.
- Verified: a delayed GET released after leaving its page did not replace the new project or its unsaved goal. Navigation controls were disabled during the held load; the generation guard itself is also inspected in source.
- Known limit: an abruptly interrupted upload can leave a durable write claim requiring operator investigation. Capacity stays reserved.
- Known limit: no per-IP throttling or automated cleanup; stored runs are capped at 20.
- Impeccable launcher and detector could not execute; manual fallback and independent rendered review were used.
- Resolved: unsent request comments now trigger navigation protection; cancelling keeps them, successful posting clears them.
- Resolved: success status receives focus; a reopened accepted version asks for a new save; server errors are associated with fields; mobile reading order and dark-rail focus were corrected and reviewed.
- Resolved in source: discard-button hover/active and primary active states retain readable foreground/background colours after the documenter found a CSS specificity conflict.
- GitHub repository created through Chrome and published using the existing SSH identity. The connector returns 403 for contents writes.
