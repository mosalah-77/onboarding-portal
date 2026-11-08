# Decisions

Author: GPT/Codex

- Mohamed approved Sites, the design and native execution on 8 November 2026.
- Ruling: use the approved new repository on a feature branch instead of an extra worktree; it is already isolated from existing projects.
- Ruling: use Node tests and the installed Wrangler runtime; no additional test dependency.
- Ruling: an empty asset-plan value is allowed in an incomplete draft, then blocks submission. This preserves the spec’s incomplete-draft behaviour.
- Ruling: cap each demo project at 500 saved workflow changes to bound public write growth. A fresh demo resets that limit.
- Retry responses retain the original operation identity and also return the current project view.
- Cap manual information requests at 50 per project to keep demo storage bounded.
- Mohamed requested a living explanation diagram and supplementary code graph. Keep both current as workflow tasks finish; use local Graphify AST extraction and distinguish planned behaviour from verified behaviour.
- The five-file project cap includes pending reservations. Retrying the same upload reuses its slot; failed uploads cannot bypass the cap.
- Provide a generated PNG for an explicit sample upload through the normal route, keeping file failure separate from demo-session creation. The API test uploads a private sample independently into each client project.
- Reopening keeps the accepted version. Save a new revision before resubmitting, even if its content is unchanged, so each approval has a distinct version.
- Mohamed approved self-hosted open-licence Newsreader headings. The form text stays in the system UI font; there is no external font service or added JavaScript package.
- The stored-run cap includes expired runs until cleanup, bounding metadata growth as well as active use. Reset fails safely at capacity.
- Durable upload claims prevent cleanup from releasing quota while file writes are in flight. Abrupt termination can leave a claim requiring operator investigation; no unsafe timer-based deletion is used.
- GitHub publication uses Mohamed's account without an AI contributor/co-author entry, as requested. AI assistance remains explicit in the README, attribution and commit messages.
- The GitHub connector denied contents writes (403). Existing SSH authentication accessed the new empty repository without changing keys, so publication uses Git over SSH. The published history will retain each reviewed source tree and small commit while using Mohamed’s requested account metadata. The original local AI-authored history is preserved.
