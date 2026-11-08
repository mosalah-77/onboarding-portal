import { PortalError, readiness, textValue, validateBrief, checklist, type BriefInput } from './brief.ts';
import { digest, id, type ActorContext } from './session.ts';
import type { projects, versions, requests, assets, events, receipts, comments, approvals } from '../db/schema';

type ProjectRow = typeof projects.$inferSelect;
type VersionRow = typeof versions.$inferSelect;
type RequestRow = typeof requests.$inferSelect;
type AssetRow = typeof assets.$inferSelect;
type EventRow = typeof events.$inferSelect;
type ReceiptRow = typeof receipts.$inferSelect;
type CommentRow = typeof comments.$inferSelect;
type ApprovalRow = typeof approvals.$inferSelect;
export type Revision = { id: string; version: number; brief: BriefInput; actor: string; createdAt: number };
export type AssetView = { id: string; name: string; size: number; contentType: string; status: string };
export type RequestView = { id: string; ruleKey: string | null; title: string; explanation: string; required: boolean; status: string; comments: { id: string; text: string; actor: string; createdAt: number }[] };
export type ProjectView = {
  id: string; name: string; state: string; token: number; latestRevision: Revision; submittedRevisionId: string | null;
  acceptedRevision: Revision | null; revisions: Revision[]; requests: RequestView[]; assets: AssetView[];
  blockers: { key: string; field: string; message: string }[];
  activity: { id: string; actor: string; action: string; details: Record<string, unknown>; createdAt: number }[];
  approvals: { id: string; revisionId: string; actor: string; createdAt: number }[];
  handoff: (BriefInput & { revisionId: string; version: number; tasks: ReturnType<typeof checklist> }) | null;
};
export async function projectRow(db: D1Database, a: ActorContext, projectId: string): Promise<ProjectRow> {
  const row = await db.prepare(`SELECT p.* FROM projects p JOIN memberships m ON m.workspace_id=p.workspace_id
    WHERE p.id=? AND m.run_id=? AND m.persona=?`).bind(projectId, a.runId, a.personaId).first<ProjectRow>();
  if (!row) throw new PortalError(404, 'This project is unavailable. Check the link or switch demo persona.');
  return row;
}
export async function getProject(db: D1Database, a: ActorContext, projectId: string): Promise<ProjectView> {
  const p = await projectRow(db, a, projectId);
  const [vs, qs, cs, fs, es, approvalsResult] = await Promise.all([
    db.prepare('SELECT * FROM versions WHERE project_id=? ORDER BY version').bind(p.id).all<VersionRow>(),
    db.prepare('SELECT * FROM requests WHERE project_id=? ORDER BY created_at,id').bind(p.id).all<RequestRow>(),
    db.prepare('SELECT c.* FROM comments c JOIN requests q ON q.id=c.request_id WHERE q.project_id=? ORDER BY c.created_at,c.id').bind(p.id).all<CommentRow>(),
    db.prepare('SELECT * FROM assets WHERE project_id=? ORDER BY created_at').bind(p.id).all<AssetRow>(),
    db.prepare('SELECT * FROM events WHERE project_id=? ORDER BY created_at DESC,id DESC').bind(p.id).all<EventRow>(),
    db.prepare('SELECT * FROM approvals WHERE project_id=? ORDER BY created_at').bind(p.id).all<ApprovalRow>(),
  ]);
  const revisions = vs.results.map(r => ({ id: r.id, version: r.version, brief: JSON.parse(r.body) as BriefInput, actor: r.actor, createdAt: r.created_at }));
  const latest = revisions.find(r => r.id === p.latest_revision_id);
  const accepted = revisions.find(r => r.id === p.accepted_revision_id) ?? null;
  if (!latest) throw new PortalError(503, 'The saved brief could not be loaded. Please retry.');
  const blockers = readiness(latest.brief, new Set(fs.results.filter(f => f.status === 'ready').map(f => f.id))) as ProjectView['blockers'];
  for (const q of qs.results) if (!q.rule_key && q.required && q.status === 'open') blockers.push({ key: q.id, field: 'requests', message: q.title });
  return {
    id: p.id, name: p.name, state: p.state, token: p.token, latestRevision: latest, submittedRevisionId: p.submitted_revision_id,
    acceptedRevision: accepted, revisions, blockers,
    handoff: accepted ? { ...accepted.brief, deadline: accepted.brief.deadline ?? 'Not agreed', revisionId: accepted.id, version: accepted.version, tasks: checklist(accepted.brief) } : null,
    assets: fs.results.map(f => ({ id: f.id, name: f.name, size: f.size, contentType: f.content_type, status: f.status })),
    requests: qs.results.map(q => ({ id: q.id, ruleKey: q.rule_key, title: q.title, explanation: q.explanation, required: !!q.required, status: q.status,
      comments: cs.results.filter(c => c.request_id === q.id).map(c => ({ id: c.id, text: c.body, actor: c.actor, createdAt: c.created_at })) })),
    activity: es.results.map(e => ({ id: e.id, actor: e.actor, action: e.action, details: JSON.parse(e.details), createdAt: e.created_at })),
    approvals: approvalsResult.results.map(v => ({ id: v.id, revisionId: v.revision_id, actor: v.actor, createdAt: v.created_at })),
  };
}
export type Operation = { id: string; revisionId?: string; requestId?: string; commentId?: string; approvalId?: string };
export async function existingOperation(db: D1Database, a: ActorContext, projectId: string, key: unknown, input: unknown): Promise<{ operation: Operation; project: ProjectView } | null> {
  const safeKey = textValue(key, 'Retry key', 100, true);
  await projectRow(db, a, projectId);
  const prior = await db.prepare('SELECT * FROM receipts WHERE project_id=? AND persona=? AND operation_key=?').bind(projectId, a.personaId, safeKey).first<ReceiptRow>();
  if (!prior) return null;
  if (prior.digest !== await digest(JSON.stringify(input))) throw new PortalError(409, 'This retry key belongs to a different change.');
  return { operation: JSON.parse(prior.result), project: await getProject(db, a, projectId) };
}
export async function mutate(db: D1Database, a: ActorContext, p: ProjectView, expected: unknown, key: unknown, input: unknown,
  action: string, operation: Operation, details: Record<string, unknown>, steps: (guard: string, operationId: string) => D1PreparedStatement[]) {
  const prior = await existingOperation(db, a, p.id, key, input);
  if (prior) return prior;
  if (!Number.isInteger(expected) || expected !== p.token) throw new PortalError(409, 'This brief changed. Your edits are still here; load the latest version before saving.');
  if (p.token >= 500) throw new PortalError(429, 'This demo project has reached its change limit. Start a fresh demo.');
  const operationId = operation.id, now = Date.now(), hash = await digest(JSON.stringify(input));
  const guard = 'EXISTS(SELECT 1 FROM receipts WHERE id=?)';
  const batch = [db.prepare(`INSERT INTO receipts (id,project_id,persona,operation_key,digest,result,created_at)
    SELECT ?,p.id,?,?,?,?,? FROM projects p JOIN memberships m ON m.workspace_id=p.workspace_id
    JOIN sessions s ON s.run_id=m.run_id AND s.persona=m.persona JOIN runs r ON r.id=s.run_id
    WHERE p.id=? AND p.token=? AND m.run_id=? AND m.persona=? AND s.id=? AND r.expires_at>?`).bind(operationId, a.personaId, key, hash, JSON.stringify(operation), now, p.id, expected, a.runId, a.personaId, a.sessionId, now),
    ...steps(guard, operationId),
    db.prepare(`UPDATE projects SET token=token+1 WHERE id=? AND ${guard}`).bind(p.id, operationId),
    db.prepare(`INSERT INTO events (id,project_id,actor,action,details,created_at) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(id(), p.id, a.personaId, action, JSON.stringify(details), now, operationId),
  ];
  let result;
  try { result = await db.batch(batch); }
  catch (error) {
    const replay = await existingOperation(db, a, p.id, key, input);
    if (replay) return replay;
    throw error;
  }
  if (!result[0].meta.changes) {
    const replay = await existingOperation(db, a, p.id, key, input);
    if (replay) return replay;
    throw new PortalError(409, 'This brief or persona changed. Reload before trying again.');
  }
  return { operation, project: await getProject(db, a, p.id) };
}
export async function saveRevision(db: D1Database, a: ActorContext, projectId: string, expected: unknown, key: unknown, input: unknown) {
  const brief = validateBrief(input), data = { action: 'save', expected, brief };
  const prior = await existingOperation(db, a, projectId, key, data);
  if (prior) return prior;
  const p = await getProject(db, a, projectId);
  if (p.state === 'approved') throw new PortalError(409, 'Ask the owner to reopen this approved brief before editing.');
  if (brief.assetIds.some(assetId => !p.assets.some(f => f.id === assetId && f.status === 'ready'))) throw new PortalError(422, 'Attach only ready files from this project.');
  const revisionId = id(), version = p.latestRevision.version + 1;
  const fields = (Object.keys(brief) as (keyof BriefInput)[]).filter(k => JSON.stringify(brief[k]) !== JSON.stringify(p.latestRevision.brief[k]));
  return mutate(db, a, p, expected, key, data, 'brief_saved', { id: id(), revisionId }, { revisionId, version, fields }, (guard, operationId) => [
    db.prepare(`INSERT INTO versions (id,project_id,version,body,actor,created_at) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(revisionId, p.id, version, JSON.stringify(brief), a.personaId, Date.now(), operationId),
    db.prepare(`UPDATE projects SET latest_revision_id=?,submitted_revision_id=NULL,state='draft' WHERE id=? AND ${guard}`).bind(revisionId, p.id, operationId),
    ...syncRuleRequests(db, p.id, brief, new Set(p.assets.filter(f => f.status === 'ready').map(f => f.id)), guard, operationId),
  ]);
}
function syncRuleRequests(db: D1Database, projectId: string, brief: BriefInput, ready: Set<string>, guard: string, operationId: string) {
  const labels = { goal: 'Business goal', audience: 'Intended audience', pages: 'Required pages', constraints: 'Constraints', assetPlan: 'Asset plan', deadline: 'Requested deadline', assetIds: 'Project assets' };
  return [db.prepare(`UPDATE requests SET status='resolved' WHERE project_id=? AND rule_key IS NOT NULL AND ${guard}`).bind(projectId, operationId),
    ...readiness(brief, ready).map(b => db.prepare(`INSERT INTO requests (id,project_id,rule_key,title,explanation,required,status,actor,created_at)
      SELECT ?,?,?,?,?,1,'open','system',? WHERE ${guard}
      ON CONFLICT(project_id,rule_key) DO UPDATE SET status='open',explanation=excluded.explanation`).bind(id(), projectId, b.key, labels[b.field], b.message, Date.now(), operationId)),
  ];
}
export function requireOwner(a: ActorContext) {
  if (a.role !== 'owner') throw new PortalError(403, 'Only the demo agency owner can do that.');
}
export async function submitBrief(db: D1Database, a: ActorContext, projectId: string, revisionId: unknown, expected: unknown, key: unknown) {
  const input = { action: 'submit', revisionId, expected };
  const replay = await existingOperation(db, a, projectId, key, input); if (replay) return replay;
  const p = await getProject(db, a, projectId);
  if (p.state !== 'draft' || p.latestRevision.id !== revisionId) throw new PortalError(409, 'Submit the current draft revision.');
  if (p.acceptedRevision?.id === revisionId) throw new PortalError(409, 'Save a new revision before submitting this reopened brief.');
  if (p.blockers.length) throw new PortalError(422, 'Complete the required inputs before submitting.', p.blockers);
  return mutate(db, a, p, expected, key, input, 'brief_submitted', { id: id(), revisionId: p.latestRevision.id }, { revisionId, version: p.latestRevision.version }, (guard, op) => [
    db.prepare(`UPDATE projects SET state='submitted',submitted_revision_id=? WHERE id=? AND ${guard}`).bind(revisionId, p.id, op),
  ]);
}
export async function createRequest(db: D1Database, a: ActorContext, projectId: string, input: Record<string, unknown>, expected: unknown, key: unknown) {
  const p = await getProject(db, a, projectId); requireOwner(a);
  const title = textValue(input.title, 'Request title', 160, true), explanation = textValue(input.explanation, 'Request explanation', 2000, true);
  if (typeof input.required !== 'boolean') throw new PortalError(422, 'Choose whether this request is required.');
  const data = { action: 'request', title, explanation, required: input.required, expected };
  const replay = await existingOperation(db, a, projectId, key, data); if (replay) return replay;
  if (p.state === 'approved') throw new PortalError(409, 'Reopen the approved brief before adding a request.');
  if (p.requests.filter(r => !r.ruleKey).length >= 50) throw new PortalError(429, 'This demo project has reached its request limit.');
  const requestId = id();
  return mutate(db, a, p, expected, key, data, 'request_created', { id: id(), requestId }, { requestId, title, required: input.required }, (guard, op) => [
    db.prepare(`INSERT INTO requests (id,project_id,title,explanation,required,status,actor,created_at) SELECT ?,?,?,?,?,'open',?,? WHERE ${guard}`).bind(requestId, projectId, title, explanation, input.required ? 1 : 0, a.personaId, Date.now(), op),
  ]);
}
async function getRequest(db: D1Database, a: ActorContext, requestId: string): Promise<RequestRow> {
  const row = await db.prepare(`SELECT q.* FROM requests q JOIN projects p ON p.id=q.project_id JOIN memberships m ON m.workspace_id=p.workspace_id
    WHERE q.id=? AND m.run_id=? AND m.persona=?`).bind(requestId, a.runId, a.personaId).first<RequestRow>();
  if (!row) throw new PortalError(404, 'This request is unavailable.');
  return row;
}
export async function commentOnRequest(db: D1Database, a: ActorContext, requestId: string, input: unknown, key: unknown) {
  const q = await getRequest(db, a, requestId), text = textValue(input, 'Comment', 2000, true);
  const data = { action: 'comment', requestId, text };
  const replay = await existingOperation(db, a, q.project_id, key, data); if (replay) return replay;
  const p = await getProject(db, a, q.project_id), commentId = id();
  return mutate(db, a, p, p.token, key, data, 'comment_added', { id: id(), commentId }, { requestId, title: q.title }, (guard, op) => [
    db.prepare(`INSERT INTO comments (id,request_id,body,actor,created_at) SELECT ?,?,?,?,? WHERE ${guard}`).bind(commentId, requestId, text, a.personaId, Date.now(), op),
  ]);
}
export async function resolveRequest(db: D1Database, a: ActorContext, requestId: string, input: unknown, expected: unknown, key: unknown) {
  const q = await getRequest(db, a, requestId); requireOwner(a);
  const explanation = textValue(input, 'Resolution explanation', 2000, true);
  const data = { action: 'resolve', requestId, explanation, expected };
  const replay = await existingOperation(db, a, q.project_id, key, data); if (replay) return replay;
  if (q.rule_key) throw new PortalError(422, 'Correct the brief field to resolve an automatic request.');
  if (q.status === 'resolved') throw new PortalError(409, 'This request is already resolved.');
  const p = await getProject(db, a, q.project_id), commentId = id();
  return mutate(db, a, p, expected, key, data, 'request_resolved', { id: id(), requestId, commentId }, { requestId, title: q.title }, (guard, op) => [
    db.prepare(`UPDATE requests SET status='resolved' WHERE id=? AND ${guard}`).bind(requestId, op),
    db.prepare(`INSERT INTO comments (id,request_id,body,actor,created_at) SELECT ?,?,?,?,? WHERE ${guard}`).bind(commentId, requestId, explanation, a.personaId, Date.now(), op),
  ]);
}
export async function approveBrief(db: D1Database, a: ActorContext, projectId: string, revisionId: unknown, expected: unknown, key: unknown) {
  const p = await getProject(db, a, projectId); requireOwner(a);
  const data = { action: 'approve', revisionId, expected };
  const replay = await existingOperation(db, a, projectId, key, data); if (replay) return replay;
  if (p.state !== 'submitted' || p.submittedRevisionId !== revisionId || p.latestRevision.id !== revisionId) throw new PortalError(409, 'Approve the current submitted version.');
  if (p.blockers.length) throw new PortalError(422, 'Resolve the required inputs before approving.', p.blockers);
  const approvalId = id();
  return mutate(db, a, p, expected, key, data, 'brief_approved', { id: id(), approvalId, revisionId: p.latestRevision.id }, { revisionId, version: p.latestRevision.version }, (guard, op) => [
    db.prepare(`INSERT INTO approvals (id,project_id,revision_id,actor,created_at) SELECT ?,?,?,?,? WHERE ${guard}`).bind(approvalId, p.id, revisionId, a.personaId, Date.now(), op),
    db.prepare(`UPDATE projects SET state='approved',accepted_revision_id=? WHERE id=? AND ${guard}`).bind(revisionId, p.id, op),
  ]);
}
export async function reopenBrief(db: D1Database, a: ActorContext, projectId: string, input: unknown, expected: unknown, key: unknown) {
  const p = await getProject(db, a, projectId); requireOwner(a);
  const reason = textValue(input, 'Reason for reopening', 2000, true), data = { action: 'reopen', reason, expected };
  const replay = await existingOperation(db, a, projectId, key, data); if (replay) return replay;
  if (p.state !== 'approved') throw new PortalError(409, 'This brief is already open for revision.');
  return mutate(db, a, p, expected, key, data, 'brief_reopened', { id: id() }, { reason, revisionId: p.acceptedRevision?.id }, (guard, op) => [
    db.prepare(`UPDATE projects SET state='draft',submitted_revision_id=NULL WHERE id=? AND ${guard}`).bind(p.id, op),
  ]);
}
