# How a brief moves through the portal

Author: GPT/Codex. Updated 8 November 2026, through implementation Task 3.

This is Mohamed's project guide. Start with one action and follow its value into storage. The diagrams describe observable code and design decisions. Solid arrows show implemented backend behaviour; dashed arrows marked “planned” show unfinished work. The browser screens, approval and deployment are still being built.

## Follow one change

Imagine Client A enters “Local residents” in the audience field. Saving creates another version of the brief. The previous version stays in the database, so a later approval can point to an exact record.

```mermaid
flowchart TD
  A[Client enters an audience] -. planned screen .-> B[POST project revisions: brief + expected token + retry key]
  B --> C{Session, CSRF and project membership valid?}
  C -->|No| X[401, 403 or 404: no change]
  C -->|Yes| D{Fields have valid types, lengths and dates?}
  D -->|No| Y[422: explain the invalid input]
  D -->|Yes| E{Has this retry key already succeeded?}
  E -->|Same input| F[Return the original operation and current project]
  E -->|Different input| G[409: key belongs to another change]
  E -->|New key| H{Is the project token still current?}
  H -->|No| I[409: reload before saving; keep local edits]
  H -->|Yes| J[(One SQL transaction)]
  J --> K[Insert version, receipt and activity; update current version and token]
  K --> L[Resolve the audience request; preserve its ID and comments]
  L --> M[Return saved project and remaining blockers]
```

The server accepts an incomplete draft. Submission is stricter: goal, audience, pages and an asset plan must be present. Choosing supplied assets requires a ready file. Required owner requests must be resolved. Constraints and the requested deadline are optional, so leaving them blank does not block submission.

## The whole workflow

```mermaid
flowchart LR
  A[Start isolated synthetic demo] --> B[Select Client A, Client B or owner]
  B --> C[Save versioned draft]
  C --> D[Read missing inputs and request comments]
  D --> C
  C --> E[Submit exact ready version]
  E -. planned .-> F[Owner approves that version]
  F -. planned .-> G[Accepted summary and checklist]
  F -. planned .-> H[Owner reopens with a reason]
  H -. planned .-> C
  U[Private asset upload] --> C
```

Persona switching is a demo facility. It demonstrates the three roles within your synthetic run; it is not real customer authentication. Another browser's run has different workspaces and projects. Client A's membership grants access only to A's workspace, even if A guesses B's project URL.

## Where the information lives

| Information | Storage | Why it exists |
| --- | --- | --- |
| Browser identity | HttpOnly cookie; only its hash is stored in `sessions` | The server identifies the current run and persona without putting an identity secret in page JavaScript. |
| Access boundary | `runs`, `workspaces`, `memberships`, `projects` in D1 SQL | Each read and write must reach a permitted project. |
| Brief content | A new `versions` row on each save | Historical content is preserved. `projects.latest_revision_id` identifies the current draft. |
| Missing inputs and conversation | `requests` and `comments` | Automatic rule keys keep one request per missing field; comments survive resolution and reopening. |
| Safe retry | `receipts` | The same operation key and input return the previous operation instead of creating it again. |
| Audit history | `events` | Each successful workflow change records who acted and what changed in the same transaction. |
| Approval | `approvals` and accepted-version pointer, planned | Approval will refer to a specific immutable version. |
| Uploaded bytes | Private R2 objects; metadata in `assets` | File access passes through the same membership boundary. |

D1 stores structured records. R2 stores file bytes. React will display the server's result. The browser is never the authority for permissions, readiness or approval.

## Find the code and its proof

| Question | Read this code | Check this evidence |
| --- | --- | --- |
| What makes a brief ready? | [`lib/brief.ts`](../lib/brief.ts), `readiness` | [`tests/brief.test.mjs`](../tests/brief.test.mjs): optional blanks, missing audience, duplicate pages, invalid date |
| Who is making the request? | [`lib/session.ts`](../lib/session.ts), `requireActor` | [`tests/api.test.mjs`](../tests/api.test.mjs): another visitor cannot read the project |
| Why can't A open B's brief? | [`lib/workflow.ts`](../lib/workflow.ts), `projectRow` | API test: Client A cannot access Client B |
| Why doesn't a retry create two versions? | `existingOperation` and `mutate` in workflow | API test: lost-response retry returns the same revision |
| What happens when two saves race? | `mutate`: conditional token check inside the transaction | API test: one 200 success and one 409 conflict |
| How do field requests stay connected to comments? | `syncRuleRequests` in workflow | API test: automatic request resolves and reopens with the same ID and comment |
| What happens at the HTTP boundary? | [`lib/http.ts`](../lib/http.ts) | API tests: missing CSRF and malformed input fail |

The checked behaviour is recorded in [verification](verification.md). A passing test establishes the scenario it ran; it does not establish every possible failure case.

## A learning checkpoint you can use

Before changing the audience rule, locate `readiness`. Explain which input it receives, what it returns, and why it does not write to SQL itself. Then read the test for the missing audience and predict the result before running `npm run test:unit`.

This is a practice exercise, not a request to choose product requirements. It is fine to follow the example and ask for an explanation first. Your own small code variation is still pending; [the learning record](learning.md) records only work you actually did.

## Keeping this guide useful

When an implementation task changes the flow, update the matching diagram and evidence row in the same commit. Replace a planned arrow only after the behaviour has passed its check. [The code graph guide](code-graph.md) explains the supplementary graph used during maintenance.

## Follow a file upload

```mermaid
flowchart TD
  A[File bytes + name + type + retry key] --> B[Check membership, streamed size and file signature]
  B --> C[Reserve a pending assets row and quota in SQL]
  C --> D[Write private R2 object only if its key is absent]
  D --> E[Mark ready and record activity in one SQL batch]
  E --> F[Attach the ready asset ID when saving a brief]
  D -->|Storage fails| G[Keep pending row; saved brief stays unchanged]
  E -->|SQL fails| H[Keep object and pending row]
  G --> I[Retry with the same bytes and operation key]
  H --> I
  I --> D
  F --> J[Download route checks membership before reading R2]
```

The pending row counts against capacity. A repeated successful upload returns the same file ID. Changing bytes while reusing its key returns 409. The file itself is immutable; a different file needs a new upload. A filename and signature check does not scan for malware. Use synthetic files only.

Read `lib/assets.ts`, `tests/assets.test.mjs` and the real R2 test in `tests/api.test.mjs` together to follow this path.
