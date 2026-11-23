'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, requestPortal, reconcileEditor, type EditorState } from '@/lib/client';
import type { AssetView, ProjectView } from '@/lib/workflow';
import { BriefEditor } from './brief-editor';
import { RequestsPanel } from './requests-panel';
import { BriefFacts, Handoff } from './handoff';
import { ThemeToggle } from './theme-toggle';

type Session = { persona: string; personaName: string; role: string; csrf: string; expiresAt: number; projects: { id: string; name: string; state: string; blockers: number }[] };
type Job = { path: string; body: Record<string, unknown>; message: string; kind?: 'save' | 'upload'; file?: File; onSuccess?: () => void };
const names: Record<string, string> = { 'client-a': 'Client A', 'client-b': 'Client B', owner: 'Agency owner', system: 'System' };
const states: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved' };
const actions: Record<string, string> = { demo_created: 'Synthetic brief created', brief_saved: 'Brief saved', brief_submitted: 'Brief submitted', brief_approved: 'Brief approved', brief_reopened: 'Brief reopened', request_created: 'Information requested', request_resolved: 'Request resolved', comment_added: 'Comment added', asset_uploaded: 'File uploaded' };

const personas = ['client-a', 'client-b', 'owner'] as const;
const when = (time: number) => new Date(time).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function NextStep({ project, owner, dirty, busy, reason, setReason, mutate, switchToOwner }: {
  project: ProjectView; owner: boolean; dirty: boolean; busy: boolean; reason: string; setReason: (value: string) => void;
  mutate: (path: string, body: Record<string, unknown>, message: string) => Promise<boolean>; switchToOwner: () => void;
}) {
  const version = project.latestRevision.version, count = project.blockers.length, blocked = count > 0;
  const reopened = project.state === 'draft' && project.acceptedRevision?.id === project.latestRevision.id;
  const title = project.state === 'approved' ? `Version ${version} is approved`
    : blocked ? `${count} ${count === 1 ? 'thing' : 'things'} to finish before ${project.state === 'submitted' ? 'approval' : 'submitting'}`
    : project.state === 'submitted' ? owner ? 'Ready for your approval' : 'Waiting for the agency owner'
    : reopened ? 'Save a new version first' : 'Ready to submit';
  const revision = { revisionId: project.latestRevision.id, expectedToken: project.token };
  return <section className={`readiness ${blocked ? 'needs-input' : 'ready'}`} aria-labelledby="next-step-title">
    <p className="eyebrow">Next step</p><h2 id="next-step-title">{title}</h2>
    {blocked ? <ul>{project.blockers.map(b => <li key={b.key}><a href={`#${b.field}`}>{b.message}</a></li>)}</ul>
      : <p>{project.state === 'approved' ? 'The handoff below is the agreed scope. Editing is locked until the owner reopens the brief.'
        : project.state === 'submitted' ? owner ? `Read the brief, then approve version ${version}. Approval freezes exactly this version.` : 'The client side is done. The agency owner now reviews and approves this version.'
        : reopened ? 'This brief was reopened. Change it and save before submitting again.' : 'Every required answer is in. Optional fields can stay blank.'}</p>}
    {project.state === 'draft' ? <button className="primary" disabled={busy || dirty || blocked || reopened} onClick={() => void mutate(`/projects/${project.id}/submit`, revision, 'Submitted. The agency owner can now review this version.')}>Submit version {version} for review</button>
      : project.state === 'submitted' ? owner ? <button className="primary" disabled={busy || dirty || blocked} onClick={() => void mutate(`/projects/${project.id}/approve`, revision, `Version ${version} approved. Its handoff is ready below.`)}>Approve version {version}</button>
        : <button className="primary" disabled={busy} onClick={switchToOwner}>Continue as agency owner</button>
      : owner ? <form onSubmit={e => { e.preventDefault(); void mutate(`/projects/${project.id}/reopen`, { reason, expectedToken: project.token }, 'Brief reopened. Save a new version before submitting again.'); }}><label htmlFor="reopen-reason">Scope changed? Say why you are reopening</label><textarea id="reopen-reason" required maxLength={2000} rows={2} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} /><button disabled={busy || !reason.trim()} type="submit">Reopen brief</button></form>
        : null}
    <p className="readiness-note">{dirty ? 'You have unsaved edits. Save the draft to update this check.' : `Checked against saved version ${version}.`}</p>
  </section>;
}

export function Portal() {
  const [session, setSession] = useState<Session | null>(null), [project, setProject] = useState<ProjectView | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const draft = editor?.draft ?? null, editToken = editor?.token ?? 0;
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null), [notice, setNotice] = useState('');
  const [retry, setRetry] = useState<Job | null>(null), [reason, setReason] = useState('');
  const [auxDirty, setAuxDirty] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<{ action: () => void; text: string; title?: string; confirm?: string } | null>(null);
  const epoch = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), errorBox = useRef<HTMLDivElement>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const dirty = !!editor && JSON.stringify(editor.draft) !== JSON.stringify(editor.baseline);
  const anyUnsaved = dirty || !!retry || !!reason.trim() || Object.values(auxDirty).some(Boolean);
  const busy = pending || !!retry;
  const applyProject = useCallback((p: ProjectView, mode: 'sync' | 'replace' | 'preserve' = 'sync') => {
    setProject(p);
    setEditor(current => reconcileEditor(current, p, mode));
  }, []);
  const loadProject = useCallback(async (id: string, keepEdits = false) => {
    const ticket = ++epoch.current; setLoading(true); setError(null); setNotice(''); setRetry(null);
    if (!keepEdits) { setProject(null); setEditor(null); setReason(''); setAuxDirty({}); }
    try {
      const p = await requestPortal<ProjectView>(`/projects/${id}`);
      if (ticket !== epoch.current) return;
      applyProject(p, keepEdits ? 'preserve' : 'replace');
      if (keepEdits) setNotice('Latest version loaded. Your edits are preserved; review the saved version in history before saving again.');
      const url = new URL(window.location.href); url.searchParams.set('project', id); window.history.replaceState(null, '', url);
    } catch (e) { if (ticket === epoch.current) setError(e instanceof ApiError ? e : new ApiError(0, 'The project could not be loaded.')); }
    finally { if (ticket === epoch.current) setLoading(false); }
  }, [applyProject]);
  useEffect(() => {
    let cancelled = false;
    requestPortal<Session>('/session').then(s => {
      if (cancelled) return; setSession(s);
      void loadProject(new URL(window.location.href).searchParams.get('project') || s.projects[0].id);
    }).catch(e => { if (!cancelled) { if (e.status !== 401) setError(e); setLoading(false); } });
    // epoch is a counter, not a DOM node: bumping the live value is what cancels stale loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { cancelled = true; epoch.current++; };
  }, [loadProject]);
  const projectId = project?.id;
  useEffect(() => { if (projectId) heading.current?.focus(); }, [projectId]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  useEffect(() => { if (notice && !pending && !error) noticeBox.current?.focus(); }, [notice, pending, error]);
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close(); }, [confirm]);
  useEffect(() => {
    if (!anyUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [anyUnsaved]);
  function navigate(action: () => void) {
    if (anyUnsaved) setConfirm({ action, text: 'You have unsaved input or an unfinished retry. Leaving this view discards it. A request that lost its response may already have saved.' });
    else action();
  }
  async function startDemo(reset = false) {
    setPending(true); setError(null);
    try { const s = await requestPortal<Session>(reset ? '/demo/reset' : '/demo', session?.csrf, {}); setSession(s); await loadProject(s.projects[0].id); }
    catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, 'The demo could not start. Retry shortly.')); }
    finally { setPending(false); }
  }
  async function switchPersona(persona: string) {
    const ticket = ++epoch.current; setPending(true); setLoading(true); setProject(null); setEditor(null); setError(null); setRetry(null);
    try {
      const s = await requestPortal<Session>('/persona', session?.csrf, { persona });
      if (ticket !== epoch.current) return;
      setSession(s); await loadProject(s.projects.find(p => p.id === project?.id)?.id || s.projects[0].id);
    } catch (e) { if (ticket === epoch.current) { setError(e instanceof ApiError ? e : new ApiError(0, 'The persona could not change.')); setLoading(false); } }
    finally { setPending(false); }
  }
  async function run(job: Job): Promise<boolean> {
    const ticket = epoch.current; setPending(true); setRetry(null); setError(null); setNotice('');
    try {
      if (job.kind === 'upload') {
        const asset = await requestPortal<AssetView>(job.path, session?.csrf, job.body, job.file);
        const p = await requestPortal<ProjectView>(`/projects/${project!.id}`);
        if (ticket !== epoch.current) return false;
        applyProject(p); setEditor(e => e ? { ...e, draft: { ...e.draft, assetIds: e.draft.assetIds.includes(asset.id) ? e.draft.assetIds : [...e.draft.assetIds, asset.id] } } : e);
      } else {
        const response = await requestPortal<{ project: ProjectView }>(job.path, session?.csrf, job.body);
        if (ticket !== epoch.current) return false;
        applyProject(response.project, job.kind === 'save' ? 'replace' : 'sync');
      }
      setNotice(job.message); job.onSuccess?.(); if (job.path.endsWith('/reopen')) setReason('');
      const s = await requestPortal<Session>('/session').catch(() => null);
      if (s && ticket === epoch.current) setSession(s);
      return true;
    } catch (e) {
      if (ticket !== epoch.current) return false;
      const failure = e instanceof ApiError ? e : new ApiError(0, 'The action could not finish. Retry shortly.');
      setError(failure); if (failure.status === 0 || failure.status >= 500) setRetry(job);
      return false;
    } finally { if (ticket === epoch.current) setPending(false); }
  }
  const mutate = (path: string, body: Record<string, unknown>, message: string, onSuccess?: () => void) => run({ path, body: { ...body, key: crypto.randomUUID() }, message, onSuccess });
  function save() {
    if (!project || !draft) return;
    void run({ path: `/projects/${project.id}/revisions`, body: { brief: { ...draft, pages: draft.pages.map(p => p.trim()).filter(Boolean) }, expectedToken: editToken, key: crypto.randomUUID() }, kind: 'save', message: 'Draft saved as a new version.' });
  }
  async function upload(file: File) {
    if (!project) return;
    if (file.size > 2097152) { setError(new ApiError(413, 'Choose a file no larger than 2 MB.')); return; }
    const ticket = epoch.current; setPending(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer()), meta = new TextEncoder().encode(JSON.stringify([file.name, file.type]));
      const input = new Uint8Array(meta.length + bytes.length); input.set(meta); input.set(bytes, meta.length);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
      const key = Array.from(hash, b => b.toString(16).padStart(2, '0')).join('');
      if (ticket !== epoch.current) return;
      await run({ path: `/projects/${project.id}/assets`, body: { key }, file, kind: 'upload', message: 'File uploaded and ticked below. Save the draft to attach it.' });
    } catch { if (ticket === epoch.current) setError(new ApiError(0, 'This file could not be read. Choose it again to retry.')); }
    finally { if (ticket === epoch.current) setPending(false); }
  }
  const owner = session?.role === 'owner';
  return <>
    <a className="skip-link" href="#main">Skip to workspace</a>
    <header className="topbar"><span className="brand">Client Brief</span><span className="demo-label">Portfolio demo · Synthetic data</span><a href="/how-it-works" target="_blank" rel="noreferrer">How it works</a><ThemeToggle /></header>
    <div className="app-shell">
      {session ? <aside className="sidebar" aria-label="Demo navigation">
        <h2 id="persona-label">Viewing as</h2><div className="persona-switch" role="group" aria-labelledby="persona-label">{personas.map(p => <button key={p} aria-pressed={session.persona === p} disabled={pending || loading} onClick={() => { if (p !== session.persona) navigate(() => void switchPersona(p)); }}>{names[p]}</button>)}</div>
        <p className="sidebar-note">Switch roles to see each side. A client only ever sees their own project.</p>
        <h2>{owner ? 'Client projects' : 'Your project'}</h2><nav className="project-nav">{session.projects.map(p => <button key={p.id} className={p.id === project?.id ? 'selected' : ''} aria-current={p.id === project?.id ? 'page' : undefined} disabled={pending || loading} onClick={() => navigate(() => void loadProject(p.id))}><span>{p.name}</span><small>{states[p.state]} · {p.blockers ? `${p.blockers} open ${p.blockers === 1 ? 'request' : 'requests'}` : 'Nothing outstanding'}</small></button>)}</nav>
        <h2 id="section-label">On this page</h2><nav className="section-nav" aria-labelledby="section-label"><a href="#brief-title">Website brief</a><a href="#requests">Information requests</a><a href="#handoff">Approved handoff</a><a href="#history">Version history</a><a href="#activity">Activity</a></nav>
        <div className="session-note"><p>{session.expiresAt ? `This demo expires ${when(session.expiresAt)}.` : 'This demo expires after 24 hours.'} Use synthetic information only.</p><button disabled={pending || loading} onClick={() => setConfirm({ action: () => void startDemo(true), text: 'Starting over ends this demo, including both clients and every saved draft. A fresh demo starts if capacity is available.', title: 'Start the demo over?', confirm: 'Start over' })}>Start over</button></div>
      </aside> : null}
      <main id="main" className={session ? 'workspace' : 'welcome'}>
        {error ? <div ref={errorBox} className="error-message" role="alert" tabIndex={-1}><h2>{error.status === 404 ? 'This item is unavailable' : error.status === 422 ? 'Check these details' : error.status === 409 ? 'This brief changed while you were editing' : 'That did not go through'}</h2><p>{error.message}</p>{error.details.length ? <ul>{error.details.map((d, i) => <li key={i}><a href={`#${d.field}`}>{d.message}</a></li>)}</ul> : null}
          <div className="button-row">{retry ? <button disabled={pending} onClick={() => void run(retry)}>Retry the same action</button> : null}{error.status === 409 && project ? <button onClick={() => void loadProject(project.id, true)}>Load latest and keep my edits</button> : null}{error.status === 401 ? <button onClick={() => navigate(() => void startDemo())}>Start a new demo</button> : null}</div>
        </div> : null}
        <div ref={noticeBox} className="notice" role="status" aria-live="polite" tabIndex={-1}>{pending ? 'Working…' : loading && project ? 'Loading the latest saved version…' : notice}</div>
        {loading && !project ? <div className="loading" aria-label="Loading workspace" role="status"><p>Loading your workspace…</p><div /><div /><div /></div> : !session ? <>
          <h1>A complete brief.<br />A clear starting point.</h1><p className="intro">Play both sides of a website project. Fill in a client’s brief, then switch to the agency owner and approve one exact version.</p>
          <button className="primary large" disabled={pending} onClick={() => void startDemo()}>{pending ? 'Starting demo…' : 'Start the demo'}</button>
          <ol className="welcome-flow"><li><strong>Complete the brief</strong><span>As Client A, add the one missing answer and save.</span></li><li><strong>Submit it for review</strong><span>Send that saved version to the agency.</span></li><li><strong>Approve and hand off</strong><span>As the owner, approve it and read the checklist.</span></li></ol>
          <p className="demo-disclosure">An independent portfolio prototype with fictional clients. Your demo has two separate client workspaces and expires after 24 hours. Role switching is simulated; storage and permission checks are real and run on the server.</p>
        </> : project && draft ? <>
          <div className="project-heading"><div><h1 ref={heading} tabIndex={-1}>{project.name}</h1><p className="muted">Version {project.latestRevision.version} · {owner ? 'Agency review workspace' : 'Client workspace'}{project.acceptedRevision && project.state !== 'approved' ? ` · Approved version ${project.acceptedRevision.version} still applies` : ''}</p></div><span className={`status ${project.state === 'approved' ? 'approved' : 'waiting'}`}>{states[project.state]}</span></div>
          <ol className="workflow-steps" aria-label="Brief workflow">
            {['Brief', 'Review', 'Handoff'].map((label, index) => {
              const current = project.state === 'approved' ? 2 : project.state === 'submitted' ? 1 : 0;
              return <li key={label} className={index < current ? 'complete' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
                <span className="step-number" aria-hidden="true">{index < current ? '✓' : `0${index + 1}`}</span><span><strong>{label}{index < current ? <span className="sr-only"> (done)</span> : null}</strong><small>{index === 0 ? 'Client fills in the facts' : index === 1 ? 'Owner approves one version' : 'Work starts from agreed scope'}</small></span>
              </li>;
            })}
          </ol>
          {dirty && editor && editor.revisionId !== project.latestRevision.id ? <div className="notice" role="status"><p>Your unsaved edits began with version {editor.version}. Version {project.latestRevision.version} is now saved. Review it before saving or submitting.</p><button disabled={pending || loading} onClick={() => void loadProject(project.id, true)}>Load latest and keep my edits</button></div> : null}
          <div className="work-columns">
            <NextStep project={project} owner={owner} dirty={dirty} busy={busy} reason={reason} setReason={setReason} mutate={mutate} switchToOwner={() => navigate(() => void switchPersona('owner'))} />
            <BriefEditor project={project} errors={error?.status === 422 ? error.details : []} draft={draft} setDraft={brief => setEditor(e => e ? { ...e, draft: brief } : e)} locked={project.state === 'approved'} busy={busy || loading} dirty={dirty} save={save} upload={file => void upload(file)} />
            <RequestsPanel key={project.id} project={project} owner={owner} busy={busy || loading} mutate={mutate} onDirty={(key, value) => setAuxDirty(old => ({ ...old, [key]: value }))} />
            <Handoff project={project} />
            <section id="history"><h2>Version history</h2><p className="muted">Every save is kept as its own version and never changes afterwards.</p>{[...project.revisions].reverse().map(revision => <details className="revision" key={revision.id}><summary>Version {revision.version} · {names[revision.actor] ?? revision.actor}{project.approvals.some(a => a.revisionId === revision.id) ? ' · Approved' : ''}</summary><BriefFacts revision={revision} prefix={`version-${revision.version}`} /></details>)}</section>
            <section className="timeline" id="activity"><h2>Activity</h2><ol>{project.activity.map(event => <li key={event.id}><strong>{actions[event.action] ?? event.action}</strong><span>{names[event.actor] ?? event.actor} · {when(event.createdAt)}</span>{event.details.version ? <p>Version {String(event.details.version)}</p> : null}{Array.isArray(event.details.fields) && event.details.fields.length ? <p>Changed: {event.details.fields.join(', ')}</p> : null}{event.details.reason ? <p>{String(event.details.reason)}</p> : null}{event.details.title ? <p>{String(event.details.title)}</p> : null}</li>)}</ol></section>
          </div>
        </> : <section><h1>Choose a project you can access</h1><p>Select a project from the demo navigation. A different client’s URL does not grant access.</p></section>}
      </main>
    </div>
    <dialog ref={dialog} onCancel={() => setConfirm(null)} aria-labelledby="discard-title"><h2 id="discard-title">{confirm?.title ?? 'Discard unsaved input?'}</h2><p>{confirm?.text}</p><div className="button-row"><button autoFocus onClick={() => setConfirm(null)}>{confirm?.title ? 'Cancel' : 'Keep editing'}</button><button className="danger" onClick={() => { const action = confirm?.action; setConfirm(null); action?.(); }}>{confirm?.confirm ?? 'Discard and continue'}</button></div></dialog>
    <footer className="site-footer">Independent portfolio work by Mohamed Elmorshedy. No client, adoption or time-saving claims.</footer>
  </>;
}
