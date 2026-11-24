import { PortalError, readiness, ruleLabels, type BriefInput } from './brief.ts';

export type Persona = 'client-a' | 'client-b' | 'owner';
export type ActorContext = { sessionId: string; runId: string; personaId: Persona; workspaceIds: string[]; role: 'client' | 'owner'; csrf: string };
export const personaNames = { 'client-a': 'Jackie Welles', 'client-b': 'Priya Nair', owner: 'Viktor Vektor' };
export const id = () => crypto.randomUUID();
export async function digest(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const result = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(result), n => n.toString(16).padStart(2, '0')).join('');
}
export async function requireActor(request: Request, db: D1Database): Promise<ActorContext> {
  const token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('portal_session='))?.slice(15);
  if (!token || token.length > 150) throw new PortalError(401, 'Start a demo session to continue.');
  const sessionId = await digest(token);
  const s = await db.prepare('SELECT s.* FROM sessions s JOIN runs r ON r.id=s.run_id WHERE s.id=? AND r.expires_at>?').bind(sessionId, Date.now()).first<{ run_id: string; persona: Persona; csrf: string }>();
  if (!s) throw new PortalError(401, 'This demo session has expired. Start a new demo.');
  const rows = await db.prepare('SELECT workspace_id,role FROM memberships WHERE run_id=? AND persona=?').bind(s.run_id, s.persona).all<{ workspace_id: string; role: 'owner' | 'client' }>();
  if (!rows.results.length) throw new PortalError(403, 'This persona has no workspace access.');
  return { sessionId, runId: s.run_id, personaId: s.persona, csrf: s.csrf, workspaceIds: rows.results.map(r => r.workspace_id), role: rows.results[0].role };
}
export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('x-portal-request') !== '1')
    throw new PortalError(403, 'Open this action from the demo site.');
}
export function checkCsrf(request: Request, actor: ActorContext) {
  checkOrigin(request);
  if (request.headers.get('x-csrf-token') !== actor.csrf) throw new PortalError(403, 'Refresh the page before trying this action.');
}
export async function sessionView(db: D1Database, a: ActorContext) {
  const rows = await db.prepare(`SELECT p.id,p.name,p.state,p.token,p.accepted_revision_id,
    (SELECT COUNT(*) FROM requests q WHERE q.project_id=p.id AND q.required=1 AND q.status='open') AS blockers
    FROM projects p JOIN memberships m ON m.workspace_id=p.workspace_id WHERE m.run_id=? AND m.persona=? ORDER BY p.name`).bind(a.runId, a.personaId).all();
  const run = await db.prepare('SELECT expires_at FROM runs WHERE id=?').bind(a.runId).first<{ expires_at: number }>();
  return { runId: a.runId, persona: a.personaId, personaName: personaNames[a.personaId], role: a.role, csrf: a.csrf, expiresAt: run?.expires_at, projects: rows.results };
}
export async function startDemo(db: D1Database, request: Request, reset?: ActorContext): Promise<Response> {
  checkOrigin(request);
  const runId = id(), token = id() + id(), sessionId = await digest(token), csrf = id(), now = Date.now();
  const batch = [db.prepare(`INSERT INTO runs (id,created_at,expires_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM runs)<20
    AND (? IS NULL OR EXISTS(SELECT 1 FROM runs r JOIN sessions s ON s.run_id=r.id WHERE r.id=? AND r.expires_at>? AND s.id=? AND s.persona=?))`).bind(runId, now, now + 86400000, reset?.runId ?? null, reset?.runId ?? null, now, reset?.sessionId ?? null, reset?.personaId ?? null)];
  const exists = 'EXISTS(SELECT 1 FROM runs WHERE id=?)';
  if (reset) batch.push(db.prepare(`UPDATE runs SET expires_at=0 WHERE id=? AND ${exists}`).bind(reset.runId, runId));
  // Calder Street starts empty so the visitor answers every question. Marsh Lane is a finished draft the studio can read.
  const empty: BriefInput = { goal: '', audience: '', pages: [], constraints: '', deadline: null, assetPlan: '', assetIds: [] };
  const seeds: [string, BriefInput][] = [['Calder Street Kitchens', empty], ['Marsh Lane Vets', { ...empty, goal: 'Let pet owners book appointments online.', audience: 'Pet owners within a few miles of the surgery.', pages: ['Home', 'Services', 'Contact'], assetPlan: 'create' }]];
  for (const [index, [name, brief]] of seeds.entries()) {
    const workspace = id(), project = id(), revision = id(), persona = index ? 'client-b' : 'client-a';
    batch.push(db.prepare(`INSERT INTO workspaces (id,run_id,name) SELECT ?,?,? WHERE ${exists}`).bind(workspace, runId, name, runId));
    for (const person of [persona, 'owner']) batch.push(db.prepare(`INSERT INTO memberships (run_id,persona,workspace_id,role) SELECT ?,?,?,? WHERE ${exists}`).bind(runId, person, workspace, person === 'owner' ? 'owner' : 'client', runId));
    batch.push(db.prepare(`INSERT INTO projects (id,workspace_id,name,state,token,latest_revision_id) SELECT ?,?,?,'draft',1,? WHERE ${exists}`).bind(project, workspace, name, revision, runId));
    batch.push(db.prepare(`INSERT INTO versions (id,project_id,version,body,actor,created_at) SELECT ?,?,1,?,?,? WHERE ${exists}`).bind(revision, project, JSON.stringify(brief), persona, now, runId));
    for (const blocker of readiness(brief, new Set())) batch.push(db.prepare(`INSERT INTO requests (id,project_id,rule_key,title,explanation,required,status,actor,created_at) SELECT ?,?,?,?,?,1,'open','system',? WHERE ${exists}`).bind(id(), project, blocker.key, ruleLabels[blocker.field], blocker.message, now, runId));
    batch.push(db.prepare(`INSERT INTO events (id,project_id,actor,action,details,created_at) SELECT ?,?,'system','demo_created','{}',? WHERE ${exists}`).bind(id(), project, now, runId));
  }
  batch.push(db.prepare(`INSERT INTO sessions (id,run_id,persona,csrf) SELECT ?,?,'client-a',? WHERE ${exists}`).bind(sessionId, runId, csrf, runId));
  const result = await db.batch(batch);
  if (!result[0].meta.changes) throw new PortalError(429, 'Demo capacity reached or this session changed. The operator must clear expired demos before more can start.');
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const cookie = `portal_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secure}`;
  const a = await requireActor(new Request(request.url, { headers: { cookie: `portal_session=${token}` } }), db);
  return Response.json(await sessionView(db, a), { headers: { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } });
}
