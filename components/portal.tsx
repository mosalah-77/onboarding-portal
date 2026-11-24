'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BriefInput } from '@/lib/brief';
import { ApiError, requestPortal } from '@/lib/client';
import type { AssetView, ProjectView } from '@/lib/workflow';
import { PEOPLE, progress, type FieldKey, type Seat } from '@/lib/conversation';
import { BriefPanel } from './brief-panel';
import { Chev, Composer, Thread, Tick, type Actions } from './chat';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

type Session = { persona: string; role: string; csrf: string; expiresAt?: number; projects: { id: string; name: string; state: string }[] };
type Job = { path: string; body: Record<string, unknown>; file?: File; done?: (asset?: AssetView) => void };
const states: Record<string, string> = { draft: 'Draft', submitted: 'Sent', approved: 'Approved' };
const initials = (name: string) => name.split(' ').slice(0, 2).map(word => word[0]).join('');
const asError = (e: unknown, fallback: string) => e instanceof ApiError ? e : new ApiError(0, fallback);

export function Portal() {
  const [session, setSession] = useState<Session | null>(null), [project, setProject] = useState<ProjectView | null>(null);
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null), [retry, setRetry] = useState<Job | null>(null);
  // Skipped optional questions are remembered for this page only. After a reload an unanswered one is asked again.
  const [skipped, setSkipped] = useState<Record<string, FieldKey[]>>({});
  const [edit, setEdit] = useState<FieldKey | null>(null), [noting, setNoting] = useState(false);
  const [menu, setMenu] = useState(false), [confirm, setConfirm] = useState<'over' | 'home' | null>(null);
  const epoch = useRef(0), dialog = useRef<HTMLDialogElement>(null), switcher = useRef<HTMLDivElement>(null);
  const busy = pending || loading;

  const loadProject = useCallback(async (id: string) => {
    const ticket = ++epoch.current; setLoading(true); setError(null); setRetry(null); setProject(null); setEdit(null); setNoting(false);
    try {
      const p = await requestPortal<ProjectView>(`/projects/${id}`);
      if (ticket === epoch.current) setProject(p);
    } catch (e) { if (ticket === epoch.current) setError(asError(e, 'The brief could not be loaded.')); }
    finally { if (ticket === epoch.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let cancelled = false;
    requestPortal<Session>('/session').then(s => { if (!cancelled) { setSession(s); void loadProject(s.projects[0].id); } })
      .catch(e => { if (!cancelled) { if (e.status !== 401) setError(asError(e, 'The demo could not be loaded.')); setLoading(false); } });
    // epoch is a counter, not a DOM node: bumping the live value is what cancels stale loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { cancelled = true; epoch.current++; };
  }, [loadProject]);
  useEffect(() => { if (confirm) dialog.current?.showModal(); else dialog.current?.close(); }, [confirm]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !switcher.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('click', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', close); };
  }, [menu]);

  async function startDemo(reset = false) {
    setPending(true); setError(null);
    try { const s = await requestPortal<Session>(reset ? '/demo/reset' : '/demo', session?.csrf, {}); setSession(s); setSkipped({}); await loadProject(s.projects[0].id); }
    catch (e) { setError(asError(e, 'The demo could not start. Try again shortly.')); }
    finally { setPending(false); }
  }
  async function endDemo() {
    setPending(true); setError(null);
    try { await requestPortal('/demo/end', session?.csrf, {}); epoch.current++; setSession(null); setProject(null); setSkipped({}); setLoading(false); }
    catch (e) { setError(asError(e, 'The demo could not be ended. Try again shortly.')); }
    finally { setPending(false); }
  }
  async function takeSeat(seat: Seat) {
    if (!session || (session.role === 'owner') === (seat === 'studio')) return;
    const ticket = ++epoch.current; setPending(true); setLoading(true); setProject(null); setError(null); setRetry(null); setMenu(false);
    try {
      const s = await requestPortal<Session>('/persona', session.csrf, { persona: seat === 'studio' ? 'owner' : 'client-a' });
      if (ticket !== epoch.current) return;
      setSession(s); await loadProject(s.projects.find(p => p.id === project?.id)?.id ?? s.projects[0].id);
    } catch (e) { if (ticket === epoch.current) { setError(asError(e, 'The seat could not change.')); setLoading(false); } }
    finally { setPending(false); }
  }
  // One runner for every change. A lost response keeps the job, so "Try again" resends the same retry key.
  async function run(job: Job) {
    if (!project) return;
    const ticket = epoch.current, id = project.id; setPending(true); setRetry(null); setError(null);
    try {
      const asset = job.file ? await requestPortal<AssetView>(job.path, session?.csrf, job.body, job.file) : undefined;
      const next = job.file ? await requestPortal<ProjectView>(`/projects/${id}`) : (await requestPortal<{ project: ProjectView }>(job.path, session?.csrf, job.body)).project;
      if (ticket !== epoch.current) return;
      setProject(next); job.done?.(asset);
      void requestPortal<Session>('/session').then(s => { if (ticket === epoch.current) setSession(s); }).catch(() => null);
    } catch (e) {
      if (ticket !== epoch.current) return;
      const failure = asError(e, 'That did not go through. Try again shortly.'), uncertain = failure.status === 0 || failure.status >= 500;
      // A file is resumed by choosing it again, which sends the same retry key and ticks it in the composer.
      setError(uncertain && job.file ? new ApiError(failure.status, 'The upload did not finish. Choose the same file again to resume it.') : failure);
      if (uncertain && !job.file) setRetry(job);
      if (failure.status === 409) void requestPortal<ProjectView>(`/projects/${id}`).then(p => { if (ticket === epoch.current) setProject(p); }).catch(() => null);
    } finally { setPending(false); }
  }
  const change = (path: string, body: Record<string, unknown>, done?: () => void) => project ? run({ path: `/projects/${project.id}/${path}`, body: { ...body, expectedToken: project.token, key: crypto.randomUUID() }, done }) : undefined;
  async function upload(file: File): Promise<AssetView | null> {
    if (!project) return null;
    try {
      // The retry key is a hash of the file, so choosing the same file again resumes the same upload.
      const bytes = new Uint8Array(await file.arrayBuffer()), meta = new TextEncoder().encode(JSON.stringify([file.name, file.type]));
      const input = new Uint8Array(meta.length + bytes.length); input.set(meta); input.set(bytes, meta.length);
      const key = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', input)), b => b.toString(16).padStart(2, '0')).join('');
      let result: AssetView | null = null;
      await run({ path: `/projects/${project.id}/assets`, body: { key }, file, done: asset => { result = asset ?? null; } });
      return result;
    } catch { setError(new ApiError(0, 'This file could not be read. Choose it again.')); return null; }
  }

  const seat: Seat = session?.role === 'owner' ? 'studio' : 'client';
  const state = project ? progress(project, skipped[project.id]) : null;
  const revision = project ? { revisionId: project.latestRevision.id } : {};
  const actions: Actions = {
    answer: (patch: Partial<BriefInput>) => void change('revisions', { brief: { ...project!.latestRevision.brief, ...patch } }, () => setEdit(null)),
    skip: k => setSkipped(old => ({ ...old, [project!.id]: [...(old[project!.id] ?? []), k] })),
    edit: k => { setError(null); setRetry(null); setEdit(k); },
    send: () => void change('submit', revision),
    approve: () => void change('approve', revision, () => setNoting(false)),
    note: setNoting,
    handBack: reason => void change('reopen', { reason }, () => setNoting(false)),
    upload, seat: next => void takeSeat(next),
    retry: retry ? () => void run(retry) : null,
    restart: () => void startDemo(),
  };
  const canEdit = seat === 'client' && !!project && project.state !== 'approved';
  const many = (session?.projects.length ?? 0) > 1, tile = (id: string) => `tile${session?.projects.findIndex(p => p.id === id) ? ' alt' : ''}`;
  const label = (p: { id: string; name: string; state: string }) => <><span className={tile(p.id)} aria-hidden="true">{initials(p.name)}</span><span className="pname"><b>{p.name}</b><small>New website · {states[p.state].toLowerCase()}</small></span></>;
  const shownProject = session?.projects.find(p => p.id === project?.id);

  return <div className="app">
    <header className="bar">
      {session ? <button type="button" className="logo" aria-label="Samepage home" onClick={() => setConfirm('home')}><Logo /></button> : <Link className="logo" href="/" aria-label="Samepage home"><Logo /></Link>}
      {session && shownProject ? <div className="proj" ref={switcher}>
        {many ? <button type="button" className="proj-btn" aria-haspopup="true" aria-expanded={menu} disabled={pending} onClick={() => setMenu(!menu)}>{label(shownProject)}<Chev d="M4 6l4 4 4-4" /></button> : <div className="proj-btn solo">{label(shownProject)}</div>}
        {menu && many ? <div className="menu"><p>Projects</p>{session.projects.map(p => <button type="button" key={p.id} aria-current={p.id === project?.id} disabled={pending} onClick={() => { setMenu(false); if (p.id !== project?.id) void loadProject(p.id); }}>{label(p)}{p.id === project?.id ? <span className="here"><Tick /></span> : null}</button>)}</div> : null}
      </div> : null}
      <div className={session ? 'view' : 'view lone'}>{session ? <><span className="who">Viewing as {PEOPLE[session.persona]?.first}</span>
        <div className="seg" role="group" aria-label="View as">{(['client', 'studio'] as const).map(s => <button type="button" key={s} aria-pressed={seat === s} disabled={pending} onClick={() => void takeSeat(s)}>{s === 'client' ? 'Client' : 'Studio'}</button>)}</div></> : null}
        <ThemeToggle /></div>
    </header>
    {session && project && state ? <div className="body">
      <main className="chat">
        <Thread key={`${project.id}-${seat}`} project={project} state={state} seat={seat} canEdit={canEdit} onEdit={actions.edit} />
        <Composer project={project} state={state} seat={seat} edit={canEdit ? edit : null} noting={noting} busy={busy} error={error} actions={actions} />
      </main>
      <BriefPanel project={project} state={state} seat={seat} canEdit={canEdit} edit={canEdit ? edit : null} busy={busy} expiresAt={session.expiresAt} actions={actions} startOver={() => setConfirm('over')} />
    </div> : !session && !loading ? <main className="hero"><div>
      <div className="pitch">
        <h1>Get your client on the same page.</h1>
        <p className="lead">Samepage is a website brief done as a chat. The studio asks six questions, the client answers them, and the studio approves the version it is going to build.</p>
        <p>You get both seats. Start as Jackie, who wants a new website for an auto shop. Then swap over and review the brief as Viktor, who runs the studio.</p>
        <div className="acts"><button type="button" className="btn" disabled={pending} onClick={() => void startDemo()}>{pending ? 'Starting…' : 'Start the demo'}</button><a href="/how-it-works">How it works</a></div>
        {error ? <p className="err" role="alert">{error.message}</p> : null}
        <p className="note">A portfolio demo by Mohamed Elmorshedy. The people and companies are made up, and each demo expires after 24 hours.</p>
      </div>
      <div className="stage" aria-hidden="true">
        <div className="msg"><span className="face">VV</span><div className="bub q">Which pages do you want?</div></div>
        <div className="msg mine"><div className="bub">Home, Services, Prices, Contact</div></div>
        <div className="msg"><span className="face">VV</span><div className="bub q">Is there a date you need it by?</div></div>
        <div className="msg mine"><div className="bub">1 March 2027</div></div>
        <p className="event">Jackie sent version 1</p>
        <div className="event big"><span className="seal"><Tick size={20} width={2.4} /></span><div><b>Version 1 approved</b><span>Viktor Vektor</span></div></div>
      </div>
    </div></main> : <main className="empty">
      {loading ? <p role="status">Loading the brief…</p> : session ? <><h1>That brief isn&rsquo;t available</h1><button type="button" className="btn" onClick={() => void loadProject(session.projects[0].id)}>Back to {session.projects[0].name}</button></> : null}
      {error && !loading ? <p className="err" role="alert">{error.message}{error.status === 401 ? <button type="button" className="link" onClick={() => void startDemo()}>Start a new demo</button> : null}</p> : null}
    </main>}
    <dialog ref={dialog} onClose={() => setConfirm(null)} aria-labelledby="confirm-title"><h2 id="confirm-title">{confirm === 'home' ? 'Leave the demo?' : 'Start the demo over?'}</h2>
      <p>{confirm === 'home' ? 'Going back to the home page ends this demo, with both projects and every saved answer.' : 'This ends the current demo, with both projects and every saved answer, and starts a fresh one.'}</p>
      <div className="acts"><button type="button" className="btn plain" autoFocus onClick={() => setConfirm(null)}>Cancel</button><button type="button" className="btn" onClick={() => { const leave = confirm === 'home'; setConfirm(null); void (leave ? endDemo() : startDemo(true)); }}>{confirm === 'home' ? 'End the demo' : 'Start over'}</button></div></dialog>
  </div>;
}
