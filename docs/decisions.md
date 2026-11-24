# Decisions

The choices that shaped Samepage, with what each one cost.

## Product

- **A conversation instead of a form.** The first version showed the brief, requests, history and activity on one screen, and a visitor had to work out the order. Now the studio asks six questions and the client answers one at a time, with a side panel that holds the status and the one action that moves the brief on. Cost: the full version history is no longer on screen. The thread shows sends, notes, changes and approvals in order.
- **Versions count sends.** Each answer is saved as its own revision, but "version 7" on a first send would only confuse a client. The interface counts a version each time the brief is sent. Cost: the number on screen is not the revision number in the database. Approval still names one stored revision by ID.
- **A sent brief is not locked.** Editing an answer takes it back to draft and the composer says so. Locking would have needed a way to unlock, and the server already handled the edit correctly.
- **One way to hand a brief back.** "Ask for changes" on a sent brief and "Reopen" on an approved one are the same route, and both need a reason, which appears in the thread as the studio's note. An approved version stays the agreed scope until another is approved.
- **The client seat has no project list.** It shows one project as a plain label. Only the studio seat gets a menu. The server enforces the same rule, so this is a matter of not offering what would be refused.
- **Seat switching is simulated; nothing else is.** A demo needs both sides in one browser. Sessions, permissions, storage and validation are real and run on the server. Cost: this is not ready for real accounts.

## Data and correctness

- **Revisions are immutable.** An answer adds a row and never edits one, so an approval can point at exactly what was approved.
- **Optimistic concurrency with a version token.** The token check sits in the same SQL batch as the write. A stale save gets a 409 and the page loads the saved brief. Cost: the loser has to send again.
- **Idempotent writes.** Every change carries a retry key stored with a digest of its input. The same key and input return the first result; the same key with different input is refused.
- **State is derived, not stored twice.** The thread, the version number and the status come from the saved project and its activity log. The one exception is a skipped optional question, which is remembered for the page only.
- **An incomplete brief can be saved but not sent.** Readiness is one function used by saving, sending and the demo's seed data.
- **The first-jobs list is computed when the project is read.** It is a deterministic suggestion from the approved answers, not stored data and not generated text.

## Files

- **Files live in D1, not R2.** R2 asks for a payment card even on its free tier, and this demo should not need one. Cost: a file stops at 1.9 MB because a D1 row holds 2 MB. Uploads go through a small storage interface, so moving to R2 later would not touch the upload logic.
- **Reserve, write, then mark ready.** A pending row claims a slot and the space before any bytes are written. A failure at any step leaves something a retry can finish, and choosing the same file again resumes it.
- **Checks are size, type and signature.** There is no virus scan. Downloads are always attachments with content sniffing off.

## Hosting and limits

- **One Cloudflare Worker and one D1 database on the free plan.** No paid services and no custom domain.
- **Bounded on purpose.** At most 20 stored demos, 500 changes per project, five files per project, 20 MiB per demo and 200 MiB overall. Expired demos count toward the cap until cleanup, which keeps storage bounded. Cost: a determined visitor can fill the 20 slots, and cleanup is a manual operator step.
- **Per-visitor rate limits.** 240 API requests a minute and 6 demo starts a minute per address. Cost: people behind one shared address share a limit.
- **Security headers on every response.** The content security policy still allows inline scripts and styles, because the framework writes its page data inline. A per-request nonce would be tighter.
- **Few dependencies.** React, Next's API through vinext, and Drizzle for the schema. The starter's UI library was removed because nothing used it.

## Interface

- **Plain CSS with a small set of colour tokens.** Dark mode is a second set of values for the same tokens. See [DESIGN.md](../DESIGN.md).
- **Two things animate:** a message arriving and the approval tick. Both are off for visitors who ask for reduced motion.
- **One self-hosted font file.** No external font service.
