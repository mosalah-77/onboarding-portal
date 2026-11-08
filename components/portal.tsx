'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, requestPortal, reconcileEditor, type EditorState } from '@/lib/client';
import type { AssetView, ProjectView } from '@/lib/workflow';
import { BriefEditor } from './brief-editor';
import { RequestsPanel } from './requests-panel';
import { BriefFacts, Handoff } from './handoff';

type Session = { persona: string; personaName: string; role: string; csrf: string; expiresAt: number; projects: { id: string; name: string; state: string; blockers: number }[] };
type Job = { path: string; body: Record<string, unknown>; message: string; kind?: 'save' | 'upload'; file?: File; onSuccess?: () => void };
const names: Record<string, string> = { 'client-a': 'Client A', 'client-b': 'Client B', owner: 'Agency owner', system: 'System' };
const states: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved' };
const actions: Record<string, string> = { demo_created: 'Synthetic brief created', brief_saved: 'Brief saved', brief_submitted: 'Brief submitted', brief_approved: 'Brief approved', brief_reopened: 'Brief reopened', request_created: 'Information requested', request_resolved: 'Request resolved', comment_added: 'Comment added', asset_uploaded: 'File uploaded' };

export function Portal() {
  const [session, setSession] = useState<Session | null>(null), [project, setProject] = useState<ProjectView | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const draft = editor?.draft ?? null, editToken = editor?.token ?? 0;
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null), [notice, setNotice] = useState('');
  const [retry, setRetry] = useState<Job | null>(null), [reason, setReason] = useState('');
  const [auxDirty, setAuxDirty] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<{ action: () => void; text: string } | null>(null);
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
    return () => { cancelled = true; epoch.current++; };
  }, [loadProject]);
  useEffect(() => { if (project) heading.current?.focus(); }, [project?.id]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  useEffect(() => { if (notice && !pending && !error) noticeBox.current?.focus(); }, [notice, pending, error]);
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close(); }, [confirm]);
  useEffect(() => {
    if (!anyUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [anyUnsaved]);
  function navigate(action: () => void) {
    if (anyUnsaved) setConfirm({ action, text: 'You have unsaved input or an unfinished retry. Leaving this view discards that input. A request that lost its response may already have saved.' });
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
    void run({ path: `/projects/${project.id}/revisions`, body: { brief: { ...draft, pages: draft.pages.map(p => p.trim()).filter(Boolean) }, expectedToken: editToken, key: crypto.randomUUID() }, kind: 'save', message: 'Draft saved as a new version. Readiness has been checked.' });
  }
  async function upload(file: File) {
    if (!project) return;
    if (file.size > 2097152) { setError(new ApiError(413, 'Choose a file no larger than 2 MiB.')); return; }
    const ticket = epoch.current; setPending(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer()), meta = new TextEncoder().encode(JSON.stringify([file.name, file.type]));
      const input = new Uint8Array(meta.length + bytes.length); input.set(meta); input.set(bytes, meta.length);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
      const key = Array.from(hash, b => b.toString(16).padStart(2, '0')).join('');
      if (ticket !== epoch.current) return;
      await run({ path: `/projects/${project.id}/assets`, body: { key }, file, kind: 'upload', message: 'File uploaded. Save the draft to attach it to this version.' });
    } catch { if (ticket === epoch.current) setError(new ApiError(0, 'This file could not be read. Choose it again to retry.')); }
    finally { if (ticket === epoch.current) setPending(false); }
  }
  const owner = session?.role === 'owner';
  return <>
    <a className="skip-link" href="#main">Skip to workspace</a>
    <header className="topbar"><a className="brand" href="/" onClick={e => { if (anyUnsaved) { e.preventDefault(); navigate(() => { window.location.href = '/'; }); } }}>Client Brief</a><span className="demo-label">Portfolio demo · Synthetic data</span><a href="/how-it-works" target="_blank" rel="noreferrer">How it works</a></header>
    <div className="app-shell">
      {session ? <aside className="sidebar" aria-label="Demo navigation">
        <label htmlFor="persona">Viewing as</label><select id="persona" value={session.persona} disabled={pending || loading} onChange={e => { const persona = e.target.value; navigate(() => void switchPersona(persona)); }}><option value="client-a">Client A</option><option value="client-b">Client B</option><option value="owner">Agency owner</option></select>
        <p className="sidebar-note">Demo roles share your run. Each client can access only their own workspace.</p>
        <h2>{owner ? 'Project queue' : 'Your project'}</h2><nav className="project-nav">{session.projects.map(p => <button key={p.id} className={p.id === project?.id ? 'selected' : ''} aria-current={p.id === project?.id ? 'page' : undefined} disabled={pending || loading} onClick={() => navigate(() => void loadProject(p.id))}><span>{p.name}</span><small>{states[p.state]} · {p.blockers ? `${p.blockers} required ${p.blockers === 1 ? 'request' : 'requests'}` : 'No required requests'}</small></button>)}</nav>
        <nav className="section-nav" aria-label="In this project"><a href="#brief-title">Brief</a><a href="#requests">Requests</a><a href="#handoff">Accepted handoff</a><a href="#history">Version history</a></nav>
        <div className="session-note"><p>Demo data expires after 24 hours. Use synthetic information only.</p><button disabled={pending || loading} onClick={() => setConfirm({ action: () => void startDemo(true), text: 'Resetting expires this run, including both clients and all saved drafts. A new synthetic run starts if capacity is available.' })}>Reset demo</button></div>
      </aside> : null}
      <main id="main" className={session ? 'workspace' : 'welcome'}>
        {error ? <div ref={errorBox} className="error-message" role="alert" tabIndex={-1}><h2>{error.status === 404 ? 'This item is unavailable' : 'Action needs attention'}</h2><p>{error.message}</p>{error.details.length ? <ul>{error.details.map((d, i) => <li key={i}><a href={`#${d.field}`}>{d.message}</a></li>)}</ul> : null}
          <div className="button-row">{retry ? <button disabled={pending} onClick={() => void run(retry)}>Retry the same action</button> : null}{error.status === 409 && project ? <button onClick={() => void loadProject(project.id, true)}>Load latest and keep my edits</button> : null}{error.status === 401 ? <button onClick={() => navigate(() => void startDemo())}>Start a new demo</button> : null}</div>
        </div> : null}
        <div ref={noticeBox} className="notice" role="status" aria-live="polite" tabIndex={-1}>{pending ? 'Saving your action…' : loading && project ? 'Loading the latest saved version…' : notice}</div>
        {loading && !project ? <div className="loading" aria-label="Loading workspace" role="status"><p>Loading your workspace…</p><div /><div /><div /></div> : !session ? <>
          <h1>A complete brief.<br />A clear starting point.</h1><p className="intro">Try a website onboarding workflow: fill the missing inputs, review the brief as the agency owner, and approve one exact version.</p>
          <button className="primary" disabled={pending} onClick={() => void startDemo()}>{pending ? 'Starting demo…' : 'Start the demo'}</button>
          <p className="demo-disclosure">This independent portfolio prototype uses fictional clients. Your demo has two isolated client workspaces and expires after 24 hours. Role switching is simulated; storage and permission checks run on the server.</p>
          <ol className="welcome-flow"><li>Complete a client brief</li><li>Submit it for review</li><li>Approve and read the handoff</li></ol>
        </> : project && draft ? <>
          <div className="project-heading"><div><h1 ref={heading} tabIndex={-1}>{project.name}</h1><p className="muted">Version {project.latestRevision.version} · {owner ? 'Agency review workspace' : 'Client workspace'}{project.acceptedRevision && project.state !== 'approved' ? ` · Accepted version ${project.acceptedRevision.version} remains in effect` : ''}</p></div><span className={`status ${project.state === 'approved' ? 'approved' : 'waiting'}`}>{states[project.state]}</span></div>
          <ol className="workflow-steps" aria-label="Brief workflow">
            {['Brief', 'Review', 'Handoff'].map((label, index) => {
              const current = project.state === 'approved' ? 2 : project.state === 'submitted' ? 1 : 0;
              return <li key={label} className={index < current ? 'complete' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
                <span className="step-number" aria-hidden="true">0{index + 1}</span><span><strong>{label}</strong><small>{index === 0 ? 'Gather the facts' : index === 1 ? 'Agree one version' : 'Start with clear scope'}</small></span>
              </li>;
            })}
          </ol>
          {dirty && editor && editor.revisionId !== project.latestRevision.id ? <div className="notice" role="status"><p>Your unsaved edits began with version {editor.version}. Version {project.latestRevision.version} is now saved. Review it before saving or submitting.</p><button disabled={pending || loading} onClick={() => void loadProject(project.id, true)}>Load latest and keep my edits</button></div> : null}
          <div className="work-columns">
            <section className={`readiness ${project.blockers.length ? 'needs-input' : 'ready'}`}><h2>{project.state === 'approved' ? 'Version approved' : project.blockers.length ? 'Inputs needed' : project.state === 'submitted' ? 'Ready for owner review' : project.acceptedRevision?.id === project.latestRevision.id ? 'Save a new revision' : 'Ready to submit'}</h2>
              <p>Based on saved version {project.latestRevision.version}.{dirty ? ' Save your edits to update this check.' : ''}</p>
              {project.blockers.length ? <ul>{project.blockers.map(b => <li key={b.key}><a href={`#${b.field}`}>{b.message}</a></li>)}</ul> : <p>Required fields and requests are complete. Optional fields can stay blank.</p>}
              {project.state === 'draft' ? <button className="primary" disabled={busy || dirty || !!project.blockers.length || project.acceptedRevision?.id === project.latestRevision.id} onClick={() => void mutate(`/projects/${project.id}/submit`, { revisionId: project.latestRevision.id, expectedToken: project.token }, 'Version submitted for owner review.')}>Submit version {project.latestRevision.version}</button> : project.state === 'submitted' ? owner ? <button className="primary" disabled={busy || dirty || !!project.blockers.length} onClick={() => void mutate(`/projects/${project.id}/approve`, { revisionId: project.latestRevision.id, expectedToken: project.token }, `Version ${project.latestRevision.version} approved. Its handoff is available below.`)}>Approve version {project.latestRevision.version}</button> : <p>Switch to the agency owner to review this version.</p> : owner ? <form onSubmit={e => { e.preventDefault(); void mutate(`/projects/${project.id}/reopen`, { reason, expectedToken: project.token }, 'Brief reopened. Save a new revision before submitting again.'); }}><label htmlFor="reopen-reason">Reason for reopening</label><textarea id="reopen-reason" required maxLength={2000} rows={2} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} /><button disabled={busy || !reason.trim()} type="submit">Reopen brief</button></form> : <p>The owner can reopen this brief if the scope changes.</p>}
              {project.state === 'draft' && project.acceptedRevision?.id === project.latestRevision.id ? <p>Save a new revision before submitting this reopened brief.</p> : null}
            </section>
            <BriefEditor project={project} errors={error?.status === 422 ? error.details : []} draft={draft} setDraft={brief => setEditor(e => e ? { ...e, draft: brief } : e)} locked={project.state === 'approved'} busy={busy || loading} dirty={dirty} save={save} upload={file => void upload(file)} />
            <RequestsPanel key={project.id} project={project} owner={owner} busy={busy || loading} mutate={mutate} onDirty={(key, value) => setAuxDirty(old => ({ ...old, [key]: value }))} />
            <Handoff project={project} />
            <section id="history"><h2>Version history</h2><p className="muted">Saved versions keep their original content. Approval always names a version.</p>{[...project.revisions].reverse().map(revision => <details className="revision" key={revision.id}><summary>Version {revision.version} · {names[revision.actor] ?? revision.actor}{project.approvals.some(a => a.revisionId === revision.id) ? ' · Approved' : ''}</summary><BriefFacts revision={revision} prefix={`version-${revision.version}`} /></details>)}</section>
            <section className="timeline"><h2>Activity</h2><ol>{project.activity.map(event => <li key={event.id}><strong>{actions[event.action] ?? event.action}</strong><span>{names[event.actor] ?? event.actor} · {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{event.details.version ? <p>Version {String(event.details.version)}</p> : null}{Array.isArray(event.details.fields) && event.details.fields.length ? <p>Changed: {event.details.fields.join(', ')}</p> : null}{event.details.reason ? <p>{String(event.details.reason)}</p> : null}{event.details.title ? <p>{String(event.details.title)}</p> : null}</li>)}</ol></section>
          </div>
        </> : <section><h1>Choose a project you can access</h1><p>Select a project from the demo navigation. A different client’s URL does not grant access.</p></section>}
      </main>
    </div>
    <dialog ref={dialog} onCancel={() => setConfirm(null)} aria-labelledby="discard-title"><h2 id="discard-title">Leave this input behind?</h2><p>{confirm?.text}</p><div className="button-row"><button autoFocus onClick={() => setConfirm(null)}>Keep editing</button><button className="danger" onClick={() => { const action = confirm?.action; setConfirm(null); action?.(); }}>Discard input and continue</button></div></dialog>
    <footer className="site-footer">Independent portfolio work by Mohamed Elmorshedy, built with AI assistance. No client, adoption or time-saving claims.</footer>
  </>;
}
