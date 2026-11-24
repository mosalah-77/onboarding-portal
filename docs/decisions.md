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

## Hosting move, 23 November 2026

- The demo moved from Sites to Cloudflare Workers on the free plan, at a `workers.dev` address. Sites already built a Cloudflare Worker, so the application code did not change. Cost: no custom domain, and the free plan's daily request and database limits apply.
- File bytes moved from R2 to an `objects` table in D1. R2 needs a payment card on the account even for free use, and this demo should not need one. The upload code talks to a small `FileStore` type with the four calls it already used, so `lib/assets.ts` and `lib/cleanup.ts` kept their logic and their tests.
- The file cap dropped from 2 MiB to 1.9 MB because D1 limits a row to 2 MB. The per-run and global reservations are unchanged.
- The starter's hosting manifest, sign-in helper, connector code and its Vite plugin were removed. `vite.config.ts` now holds the Worker name and the D1 binding. A database ID is an identifier, not a credential; the operator token stays a Worker secret.
- The starter's install and runtime scripts under `scripts/` stay because the build and test commands use them.

## Conversation interface, 24 November 2026

- The form workspace was replaced. It showed the brief, requests, history and activity at once, and a visitor had to work out the order. The new interface is a chat: the studio asks six questions, the client answers one at a time, and a side panel holds the status and the one action that moves the brief on. Cost: the version history and activity lists are no longer on screen, though the thread shows sends, notes, changes and approvals in order.
- The product is called Samepage in the interface. The people are Jackie Welles (client), Viktor Vektor (studio) and Priya Nair (the second client), and the projects are Calder Street Kitchens and Marsh Lane Vets.
- Each answer is saved as its own revision through the existing save route. The interface counts a version each time the brief is sent, because "version 7" on a first send would only confuse a client. Approval still names one stored revision by ID. Cost: the number on screen is not the revision number in the database.
- The thread, version number and status are derived from the saved project in `lib/conversation.ts`. The browser keeps no copy of the conversation, so a reload and the other seat agree. The exception is a skipped optional question, which is remembered for the page only and asked again after a reload until the brief has been sent once.
- The seat switch offers Client and Studio. The client seat is Jackie and sees one project as a plain label. The project menu exists only for the studio seat. The second client still exists on the server and in the API tests, where it proves that one client cannot read another's project.
- `POST /projects/:id/reopen` now also accepts a submitted brief. That is "Ask for changes": the brief returns to draft, the reason is stored on a `brief_returned` event and shown in the thread as the studio's note. Reopening an approved brief works as before. A draft cannot be handed back. No migration was needed.
- After a brief is handed back, the interface asks for a changed answer before it can be sent again, and Save stays disabled on an edit that changes nothing. The server enforces this only for a reopened approval; for a returned brief it is an interface rule.
- Editing an answer on a sent brief takes it back to draft, which the save route already did. The composer says so instead of locking the answers.
- Choosing to send files requires one attached file before the answer can be sent, because the server refuses to send a brief without one. A sample image can be attached with one click.
- The demo starts with an empty brief for Calder Street so a visitor answers every question. Marsh Lane starts as a finished draft the studio can read. Seeded missing-answer requests are now created from the same readiness rule as saved ones.
- The request and comment routes stay in the API with their tests. The interface no longer uses them, because the studio's note on a returned brief covers the need.
- `reconcileEditor` and its tests were removed with the form. There is no long-lived editor state to reconcile now.
- Figtree replaces Newsreader and the system font. One self-hosted variable file, weights 400 to 600. The palette is a family of blues with flat fills, and dark mode is neutral charcoal. See `DESIGN.md`.
- The starter favicon was replaced with the Samepage mark.
- `.impeccable/design.json` and `docs/design-review.md` described the old interface and were deleted. `DESIGN.md` is the design record.
