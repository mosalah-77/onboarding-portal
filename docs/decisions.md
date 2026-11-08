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
- On 8 November 2026, the guided code exercise added a scheduling reminder for an accepted brief with no deadline. An entered date keeps its review task. Deadline remains optional, the accepted facts stay unchanged, and no database migration is needed. The checklist is derived when the project is read, so the reminder also applies to existing accepted briefs with a blank date.

## Final review rulings

- Real customer identity and invitations remain outside this synthetic demo. Cost: this is not ready for real client accounts.
- Manual cleanup, the 20-run cap, no per-IP throttle and no automatic abandoned-claim repair remain explicit limits. Cost: an operator must recover capacity and investigate interrupted uploads; hostile traffic can deny new demo starts.
- File checks do not include malware scanning. Cost: use synthetic files; real uploads need a separate security decision. Downloads remain scoped attachments with `nosniff`.
- Design token documentation was completed after the code-review range. Hosted behaviour and publication metadata will be verified during release. Cost: local tests alone do not prove a deployed configuration.
- Mohamed completed the guided deadline-reminder exercise and local verification. The learning record distinguishes his edits and checks from the code examples and explanations supplied by GPT/Codex; it makes no claim of unaided implementation.
- Broad dependency vulnerability auditing and full screen-reader/cross-browser testing were not part of this review. Cost: compatibility and dependency issues outside the exercised paths may remain.
- Deferred minor: surrounding whitespace in manually supplied retry keys is not consistently handled. The shipped browser produces UUIDs; external API clients are not supported. Normalize or reject such keys before offering an integration contract.
