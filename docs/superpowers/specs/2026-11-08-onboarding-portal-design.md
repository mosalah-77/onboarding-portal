# Independent onboarding portal: proposed design

Date: 8 November 2026
Author: GPT/Codex
Status: Design approved by Mohamed on 8 November 2026; native execution in progress.

Design review: an independent builder check on 8 November 2026 returned “nothing important left” to clarify before planning. This reviews the written design only; it is not test evidence or user approval.

## Purpose and ownership

Build one independent portfolio project for Mohamed Elmorshedy: a client supplies a website brief, an agency owner resolves missing inputs and approves an exact revision, and the system produces a traceable handoff. This is a synthetic scenario, not commissioned Halvern work or evidence of paid demand.

Mohamed wants to understand and maintain the system. Delivery therefore includes learning checkpoints and a documented change made by Mohamed, as well as working software. FixCity remains a separate project; the booking and CSV-import alternatives are outside this build.

Create original application code in a separate repository after design approval. Do not copy Halvern/QL Tech application code, client material, logos, licensed fonts, private records or Quin's work. Use ordinary stack and interaction conventions where appropriate. Track any public starter and dependency licences in an attribution file. Publishing source is conditional on a secret/attribution review and an identified personal GitHub destination; no existing company repository is a destination.

## Approaches and platform choice

| Approach | Fit | Trade-off |
| --- | --- | --- |
| Fresh Sites starter: React, TypeScript, server routes, D1 SQL and private R2 objects | Matches the newer starter present in the workspace and keeps frontend/backend deployment together | Platform-specific runtime; application code must enforce membership and version transitions |
| Fresh Next.js project with a separate Supabase project | Matches the older website stack; auth, database policies and storage can use Supabase | Requires independent project/account configuration and a separate hosting setup |

Mohamed selected the recommended Sites project. Initialise it from the supplied starter and preserve its licences. Keep the existing command-center repository separate. Pin the versions actually used; the version numbers found during reconnaissance are not a compatibility guarantee. Use the starter's existing UI, database and validation dependencies where they fit. Version one needs no AI provider.

The existing workspace documents support React/TypeScript and a restrained, readable interface. This new demo uses original layout and copy: warm light surfaces, dark text, a single accessible action colour and system fonts. No permission to publish Halvern branding is inferred.

## Smallest complete workflow

1. Start a synthetic demo session and enter as Demo Client A.
2. Open an incomplete brief with a missing audience and an explicit missing-input explanation.
3. Save a draft, review blockers, and submit a ready revision to the owner.
4. Switch deliberately to Demo Agency Owner, see both synthetic projects, review the submitted revision and its request comments, and approve that exact revision.
5. Show the frozen accepted brief, a factual handoff and a checklist derived from it.
6. Reopen with a recorded reason, create a new draft and show that the previous approval still points to the old revision.
7. As Demo Client A, attempt Demo Client B's URL and asset URL and receive denied access without B's content.

Submission is a separate action from saving. Drafts may be incomplete. Submission and approval require no current blockers. Rejected submission returns the field reasons and preserves the saved draft.

## Identity and permissions

Public access means visitors can enter a demonstration, not access a shared company workspace. Each browser receives an isolated demo run containing two client workspaces, one project per workspace, and three synthetic personas. The owner has membership in both client workspaces; each client has membership only in its own workspace. No real email invitations or third-party identity accounts are required for version one.

A high-entropy, opaque session token lives in a Secure, HttpOnly, SameSite cookie; store only its hash server-side. Local loopback development may omit Secure. The server resolves the current run, persona and membership from that session. Persona switching selects only one of that run's seeded personas and is prominently labelled as demo identity simulation. Browser-supplied project, asset, revision, request or membership IDs never grant access by themselves.

Every page, read API, write API, asset download and handoff checks server-side membership. Every mutation also checks its role. Clients may edit, submit and comment on their own project. Only the owner may create manual information requests, resolve manual requests, approve or reopen. Clients can request reopening through a comment; they cannot bypass the owner's reopen action. The owner is an intentional member of both workspaces, not an unrestricted query shortcut.

Use same-origin checks and a session-bound CSRF token for state-changing requests, including persona switching and demo reset. Private responses use no-store caching. An unauthorised object lookup returns the same safe not-found response as an absent object; never leak names, file bytes or brief content. Direct API tests must prove this independently of hidden UI controls.

Demo identities are intentionally switchable within a visitor's own run. The tests must prove that the server enforces the selected persona's permissions. Real client use would also require verified identities and an invitation/account policy.

## Brief and explicit readiness rules

| Field | Rule for submission/approval |
| --- | --- |
| Business goal | Required, non-empty after trimming; maximum 2,000 characters |
| Intended audience | Required, non-empty after trimming; maximum 2,000 characters |
| Required pages | At least one, at most ten; distinct names after case-insensitive trimming; maximum 80 characters each |
| Constraints | Optional, maximum 2,000 characters; blank displays as “Not supplied” |
| Asset plan | Required choice: “Use supplied assets” or “Assets need to be created” |
| Assets | If using supplied assets, at least one ready upload must be attached to the revision; failed/pending uploads do not count |
| Requested deadline | Optional ISO calendar date; blank means “Not agreed”; never described as an agency promise |

Non-empty invalid optional values must be corrected or cleared; blank optional values never block submission or approval. A malformed date is invalid, while a past requested date is shown for owner review rather than silently turned into a new commitment. No budget field is added in version one.

The server is authoritative. The client may show the same deterministic validation for immediate feedback, but cannot bypass it. Explain blockers by field and corrective action, not a misleading percentage readiness score.

Automatic information requests use stable rule keys, such as `audience.required`. Maintain at most one request per project and rule. Re-evaluate them after saved changes: a correction marks a request resolved; a regression reopens the same request and preserves comments. An idempotency key prevents retries from creating duplicate submissions, comments or manual requests. Conflicting reuse of a key with different data fails clearly.

Manual information requests have a title, explanation and required/optional designation. Only unresolved required manual requests block submission/approval. Only the owner resolves them, with a comment explaining resolution. Optional requests remain visible without blocking.

## Revisions, approval and concurrent edits

Every successful save creates an immutable brief revision with its actor, timestamp, field values and exact asset IDs. A project points to its latest revision. Submitting identifies that exact revision. There is one current submitted revision and one current accepted approval pointer per project, plus append-only history.

Use this state progression: `draft → submitted → approved`; editing a submitted revision creates a new draft and invalidates the pending submission. An approved project must be reopened by the owner with a non-blank reason before further edits. Reopening preserves the accepted revision and approval event, changes current status to draft and permits a new revision. Until that new revision is approved, show “Approved vN; changes awaiting review.” Never display the new draft as accepted scope.

Each mutation supplies the expected project revision/state token. The database accepts it only if that token and the authorised state still match. A stale save or approval returns HTTP 409 with a reload/compare action; retain unsaved form values so the user can copy or deliberately reapply them. Do not silently merge or overwrite. If an approval races an edit, only one transition can win: the other must retry from current state.

Approval verifies current membership, owner role, submitted revision, all deterministic rules, required manual requests and ready attached assets again on the server. The approval, accepted pointer and activity event commit atomically. No API may update an existing brief revision or approval in place.

Implementation constraint: use conditional database writes, uniqueness/foreign-key constraints and transactional batches; a read followed by unconditional writes is insufficient. D1 documents that SQL failures roll back a batch. A conditional update affecting zero rows must be explicitly treated as a conflict, with dependent writes gated so they cannot still succeed. The implementation and race tests must verify that property. [D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)

## Assets and recovery

Use private object storage, accessed only through a membership-checked backend route. Generate object keys on the server and bind them to the current run/workspace/project. Never accept a client-provided storage key as authorisation or expose a public bucket URL.

Proposed demo limits: PNG, JPEG or PDF; maximum 2 MiB per file; five ready files per project and 20 MiB total per run. Validate actual bytes, signatures, extension and declared type; check streaming/body limits before reading an unbounded body. File-type validation is not malware scanning. Serve uploads as attachments with a safe filename and nosniff; no arbitrary SVG/HTML previews.

The brief save and file upload are separate recoverable actions. Reserve a pending asset record and quota before writing bytes; mark it ready only after object storage succeeds. Attach only ready assets to a saved revision. A retry uses the same asset operation identity, and concurrent retries cannot create duplicate assets or exceed quota. If storage fails, show a retryable upload error and keep the brief. If metadata finalisation fails after storage succeeds, retain the pending record/object for a retry to reconcile. Do not make the brief depend on success of a cleanup request.

Approved revision assets are immutable and remain downloadable for the run's lifetime. Replacing an asset creates a new asset ID; it never overwrites bytes referenced by an approval. Version one has no general asset-deletion feature. Resetting/expiring a whole demo run is a separate, explicitly labelled operation.

R2's Worker API provides object reads and writes through bindings; conditional writes may return no stored object. Check that result, not only thrown errors. The design treats SQL and object writes as separate operations requiring reconciliation. [R2 Worker API documentation](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

## Minimal persisted model

| Record | Responsibility |
| --- | --- |
| Demo run and session | Isolated visitor dataset, selected persona, token hash, expiry and quotas |
| Workspace and membership | Client boundary, synthetic person identity and client/owner role |
| Project | Latest/submitted/accepted pointers, workflow state and concurrency token |
| Brief revision | Immutable brief values and author; linked immutable asset IDs |
| Asset | Owner scope, private key, type/size/digest and pending/ready/failed state |
| Information request and comment | Rule or manual request, blocking flag, resolution and discussion |
| Approval | Exact revision, approving owner, approval time; history remains intact |
| Activity event | Actor, action, version/request reference and changed field names or reopen reason |
| Mutation receipt | Scoped idempotency key, request digest and persisted operation/result identity |

Use foreign keys and uniqueness constraints to prevent cross-project references and duplicate operations. Apply the tenant/run scope to all lookups and joins. Checklist items and the handoff are derived from an accepted revision and do not require a new task-management table.

## Interface and handoff

Use Impeccable's Operate guidance for the task screens. Keep the current revision, readiness explanation and next action visible together. Use its accessibility and rendered-layout review before release. Use Humanizer in embedded mode for every public text surface, including errors, seed copy, metadata, the README and the portfolio explanation. Preserve field names, numerical rules, links and the distinction between simulated and working features.

Use four views: demo entry/persona selection; agency project queue; project brief with requests and activity; accepted brief with handoff. Reuse the project view for history rather than adding a separate dashboard for every entity.

Show a persistent “Independent portfolio demo · Synthetic data” label and the current persona. The project header distinguishes draft, ready to submit, submitted, approved and changes awaiting review. Keep blockers beside their fields and in an actionable summary. Comments are attached to individual requests, never a global chat.

The accepted handoff names its revision and includes goal, audience, page list, constraints, asset references and requested deadline, with links back to the matching accepted facts. Generate a checklist with one build/review item per requested page, asset preparation based on the asset plan, and responsive/accessibility review. Explicitly label this a suggested delivery checklist, not a delivery promise. No AI generation is necessary.

On mobile, stack the brief and request panel, keep controls comfortably tappable and contain any wide history content. Use semantic labels/headings, visible keyboard focus, linked inline errors, announced save/upload status, accessible confirmation dialogs and non-colour status labels. Test keyboard use, contrast, 200% zoom, reduced motion and 390 px layout. No decorative animation or invented metrics.

## Demo lifetime and public deployment

Runs expire after 24 hours, with the reset/expiry behaviour disclosed before entry. Expired sessions cannot read or write. A documented cleanup operation removes expired run data and private objects, safely retrying partial cleanup. Local fixtures are deterministic and reset only a dedicated demo/test dataset.

Before public writes are enabled, impose server-side per-run limits and a global capacity limit; when full, return a clear “Demo capacity reached” response without creating more data. Proposed initial maximum: 20 active runs and 200 MiB of stored uploads across all runs. Stored data counts against capacity until cleanup actually succeeds. This avoids relying solely on an easy-to-reset cookie for cost control. Determine the platform-supported cleanup trigger during implementation; if automatic scheduling needs a separate service, use the documented operator cleanup for version one and disclose that limitation.

No new paid subscription, payment details, account terms, external messages or company account changes are authorised by this design. Use the existing connected hosting capability only within its established terms. Any additional decision must name the actual service/action and be presented after the relevant implementation and verification are ready. A public demo URL remains a completion requirement; local success alone is not completion.

## Verification and acceptance evidence

Run tests against the actual server routes and local database/storage runtime, not just mocked UI permissions. Deploy only after local checks; then repeat the public workflow and key access checks against a separate hosted demo run.

| Case | Observable result |
| --- | --- |
| Client A requests B's project, revisions, request comments, handoff or asset | Safe denial; no B content; no mutation |
| Another visitor requests a known run/project ID | Same denial; session/run boundary enforced |
| Client sends owner-only approval/reopen/manual-resolution API calls | Denied even when invoked outside the UI |
| Audience is blank; optional constraints/deadline are blank | Audience blocks approval with an explanation; optional blanks do not |
| Supplied-assets plan has only a failed/pending upload | Blocks until a ready file is attached; form remains editable |
| Identical submit/manual request/comment is retried | One operation and one appropriate activity event; same result is recoverable |
| Two saves use the same expected revision | One succeeds; the other gets 409; no lost revision |
| Save and approval race | No approval of stale scope; old accepted revision remains unchanged |
| Asset store fails, or metadata write fails after store succeeds | Draft survives; retry reconciles; no false ready state or duplicate attachment |
| Reopen has no reason; then has a reason | First rejected; second recorded; accepted version/files remain intact |
| Required manual request unresolved; optional request unresolved | Required one blocks; optional one does not |
| Unsupported/oversized file and quota race | Rejected server-side; no unbounded allocation or quota bypass |
| Session missing/expired; CSRF request forged | Protected operations denied with no write |
| Keyboard/mobile/error-state walkthrough | Usable focus, labels, error recovery and layout without page overflow |

Keep expected fixture results and actual commands/results in a verification record. Do not claim a test passed before running it. The 90-second demonstration must show the real backend save, exact approval, derived checklist and access denial. Optional AI, real invitations, invoices/contracts, billing, integrations and general project management are future work.

## Learning checkpoints and attributable delivery

Before accepting each meaningful change, Mohamed explains: the input; where it is saved; the likely failure; and the evidence of success. He predicts a specific test before it runs. Record his actual explanation and corrections, not an invented contribution.

1. **Rules and save:** with a filled goal/audience/page list, “Assets need to be created” selected and no unresolved required manual requests, predict whether blank constraints and deadline may submit. Trace the browser request to validation, membership and the saved revision.
2. **Permissions and files:** predict Client A's result for B's asset URL. Explain why an ID and a hidden button are insufficient protection.
3. **Approval and concurrency:** predict two saves from the same revision and explain why acceptance pins a revision rather than the mutable project.
4. **Mohamed's variation:** change a documented validation limit or checklist wording himself, update the relevant test, and explain the result before merging that change.

Use small commits for original scaffold/schema, rules/permissions, workflow/assets, UI/handoff and verification/docs, adjusting boundaries to keep each coherent. Keep AI authorship accurately labelled; Mohamed's authored change must not be fabricated. No force-push or rewriting unrelated history.

After approval, place this design in the new repository's `docs/superpowers/specs/`, commit it, and maintain decision and issue logs there. The README must include setup/seed/test commands, architecture/data flow, demo URL, status per feature (working/simulated/future), limitations, attribution and an honest contribution/AI-use note. GitHub publication needs the intended personal repository/account identified; do not guess it from Halvern remotes.

## Initial decision log

| ID | Decision | Status and reason |
| --- | --- | --- |
| D01 | Build the onboarding portal first | Confirmed by Mohamed's selection of the onboarding portal's Sites route; other prototypes deferred |
| D02 | Fresh Sites project with SQL/private object storage | Selected by Mohamed on 8 November 2026 |
| D03 | Switchable demo identities in a visitor-isolated run | Agent proposal; supports the specified demo-persona route with honest limits |
| D04 | Immutable revisions; explicit owner reopen | Agent proposal; protects accepted scope and makes changes explainable |
| D05 | No AI in version one | Scope decision from the brief: deterministic workflow first |
| D06 | English, original restrained interface and system fonts | Agent default; avoids new font licensing and branding permissions |
| D07 | Apply installed skills to their relevant work | Requested by Mohamed: Impeccable for design and Humanizer for all published text; use testing, security and verification skills when their work begins |

## Initial issue log

| ID | Issue | Next evidence/action |
| --- | --- | --- |
| I01 | Platform selected; full design and execution approach awaiting confirmation | Present the design and implementation plan together before scaffolding |
| I02 | Storage/deployment contracts checked; actual provisioned bindings unverified | Sites supports D1/R2 declarations and schema-only migrations; verify the new project's bindings during implementation |
| I03 | Personal GitHub destination not supplied | Identify the intended account/repository before source publication |
| I04 | No tests or deployment exist for this project yet | Implement and record acceptance evidence; never report this design as a built app |
| I05 | Demo identity and upload limits are not production security | State limits in UI/README; require real identity and further upload controls before real clients |
| I06 | Impeccable context launcher cannot execute in this environment | Followed its documented fallback: read the project brief and skill references directly; do not claim the launcher or automated design checks ran |

## Definition of complete

A working public URL, isolated synthetic seed data, a complete demonstrated workflow, passing permissions/failure/race checks, mobile and accessibility evidence, reproducible setup, clean attributable Git history and publication to the agreed personal GitHub destination with no secrets and preserved licences. Include the architecture explanation, known limitations, honest AI-use note and Mohamed's recorded learning/change. A proposed design, a screenshot or a frontend-only simulation does not meet completion.
