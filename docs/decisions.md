# Decisions

Author: Mohamed Elmorshedy

- Sites hosting, the design and native execution were approved on 8 November 2026.
- Ruling: use the approved new repository on a feature branch instead of an extra worktree; it is already isolated from existing projects.
- Ruling: use Node tests and the installed Wrangler runtime; no additional test dependency.
- Ruling: an empty asset-plan value is allowed in an incomplete draft, then blocks submission. This preserves the spec’s incomplete-draft behaviour.
- Ruling: cap each demo project at 500 saved workflow changes to bound public write growth. A fresh demo resets that limit.
- Retry responses retain the original operation identity and also return the current project view.
- Cap manual information requests at 50 per project to keep demo storage bounded.
- The project keeps a living explanation diagram and a supplementary code graph. Keep both current as workflow tasks finish; use local Graphify AST extraction and distinguish planned behaviour from verified behaviour.
- The five-file project cap includes pending reservations. Retrying the same upload reuses its slot; failed uploads cannot bypass the cap.
- Provide a generated PNG for an explicit sample upload through the normal route, keeping file failure separate from demo-session creation. The API test uploads a private sample independently into each client project.
- Reopening keeps the accepted version. Save a new revision before resubmitting, even if its content is unchanged, so each approval has a distinct version.
- Headings use self-hosted, open-licence Newsreader. The form text stays in the system UI font; there is no external font service or added JavaScript package.
- The stored-run cap includes expired runs until cleanup, bounding metadata growth as well as active use. Reset fails safely at capacity.
- Durable upload claims prevent cleanup from releasing quota while file writes are in flight. Abrupt termination can leave a claim requiring operator investigation; no unsafe timer-based deletion is used.
- The repository is published from Mohamed's GitHub account. The README describes how the project was made.
- Publication uses Git over SSH with the existing key.
- On 8 November 2026, the guided code exercise added a scheduling reminder for an accepted brief with no deadline. An entered date keeps its review task. Deadline remains optional, the accepted facts stay unchanged, and no database migration is needed. The checklist is derived when the project is read, so the reminder also applies to existing accepted briefs with a blank date.

## Final review rulings

- Real customer identity and invitations remain outside this synthetic demo. Cost: this is not ready for real client accounts.
- Manual cleanup, the 20-run cap, no per-IP throttle and no automatic abandoned-claim repair remain explicit limits. Cost: an operator must recover capacity and investigate interrupted uploads; hostile traffic can deny new demo starts.
- File checks do not include malware scanning. Cost: use synthetic files; real uploads need a separate security decision. Downloads remain scoped attachments with `nosniff`.
- Design token documentation was completed after the code-review range. Hosted behaviour and publication metadata will be verified during release. Cost: local tests alone do not prove a deployed configuration.
- Mohamed completed the guided deadline-reminder exercise and local verification. The learning record distinguishes his edits and checks from the code examples and explanations he was given; it makes no claim of unaided implementation.
- Broad dependency vulnerability auditing and full screen-reader/cross-browser testing were not part of this review. Cost: compatibility and dependency issues outside the exercised paths may remain.
- Resolved on 23 November 2026: retry keys are trimmed once before they are stored, so a key sent with surrounding whitespace replays like any other. It was deferred earlier because the browser only produces UUIDs.

## Interface pass, 23 November 2026

- Goal: a clearer, calmer workspace with small animations. The palette, Newsreader headings and dark rail from the approved direction stay.
- The readiness panel is now a **Next step** card. Its heading says what is left and who acts; when a client has submitted, it offers a button that switches to the agency owner. Cost: the heading is longer, so its type is smaller (1.6rem).
- Persona selection is a three-button switcher in place of a select. All three roles are visible without opening a menu.
- "Accepted handoff" is now "Approved handoff", so the status label and the handoff use one word. "Asset plan" reads "Images and files" and "Required pages" reads "Pages the site needs". Stored values (`create`, `supplied`) and the API are unchanged; only labels moved. Automatic request titles created from now on use the new labels.
- An approved brief hides its Save button and upload field. The server already refused both; the controls only invited a failed action.
- The identity bar and rail are sticky. Motion is CSS-only (no new dependency), uses opacity and transform, and is removed under `prefers-reduced-motion`. Panels remain flat; the dialog is still the only raised surface.
- The side rail shows the run's real expiry time from `expiresAt`, which the session response already carried.
- In windows shorter than 600px, which includes a laptop zoomed to 200%, the bar and rail stop being sticky so they do not crowd the content.
- Dropdowns drop the native appearance and draw their own arrow, because WebKit otherwise renders them shorter than the other fields.
- A rejected request has its unread body read and dropped, up to 3 MiB and without buffering, before the error reply. Larger bodies are cancelled.
- Light mode was too bright. The page and panels moved from cream and pure white to a warm stone and an off-white, and state fills were toned down to match.
- Dark mode is a second set of values for the same color tokens, switched by `data-theme` on the root element. It adds no dependency: one small client component for the button and a one-line inline script that applies the saved or system theme before first paint. `next-themes` is in the starter's dependencies but is not used.
- The navigation rail keeps its dark green in both modes so the product looks like itself either way.
