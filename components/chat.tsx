'use client';
import { useEffect, useRef, useState } from 'react';
import type { BriefInput } from '@/lib/brief';
import type { ApiError } from '@/lib/client';
import type { AssetView, ProjectView } from '@/lib/workflow';
import { MAX_FILE_BYTES } from '@/lib/storage';
import { PEOPLE, STUDIO, canSend, clock, day, field, plural, shown, type FieldKey, type Progress, type Seat } from '@/lib/conversation';

export type Actions = {
  answer: (patch: Partial<BriefInput>) => void; skip: (k: FieldKey) => void; edit: (k: FieldKey | null) => void;
  send: () => void; approve: () => void; note: (open: boolean) => void; handBack: (reason: string) => void;
  upload: (file: File) => Promise<AssetView | null>; seat: (seat: Seat) => void; retry: (() => void) | null; restart: () => void;
};
export const Tick = ({ size = 11, width = 2.8 }: { size?: number; width?: number }) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" /></svg>;
export const Chev = ({ d }: { d: string }) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
export const sendLabel = (state: Progress) => state.sent ? `Send version ${state.round}` : 'Send for approval';

export function Thread({ project, state, seat, canEdit, onEdit }: { project: ProjectView; state: Progress; seat: Seat; canEdit: boolean; onEdit: (k: FieldKey) => void }) {
  const brief = project.latestRevision.brief, client = PEOPLE[state.client], studio = PEOPLE.owner;
  // Only messages that arrive after the thread first appears get the arrival animation.
  const keys = state.items.map(item => item.key);
  const [seen, setSeen] = useState(keys), [fresh, setFresh] = useState<string[]>([]);
  const added = keys.filter(key => !seen.includes(key));
  if (added.length) { setSeen([...seen, ...added]); setFresh([...fresh, ...added]); }
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [keys.length]);
  return <div className="thread" ref={box} tabIndex={0} role="log" aria-label="Brief conversation"><div>{state.items.map(item => {
    const arrive = fresh.includes(item.key) ? ` new${'late' in item && item.late ? ' late' : ''}` : '';
    if (item.kind === 'approved') return <div key={item.key} className={`event big${arrive}`}><span className="seal"><Tick size={20} width={2.4} /></span><div><b>Version {item.round} approved</b><span>{studio.name}, {clock(item.at)}</span></div></div>;
    if (item.kind === 'event') return <p key={item.key} className={`event${arrive}`}>{item.text}</p>;
    const from: Seat = item.kind === 'a' ? 'client' : item.kind === 'q' ? 'studio' : item.from, person = from === 'client' ? client : studio, mine = from === seat;
    let bubble;
    if (item.kind === 'q') { const f = field(item.field); bubble = <div className="bub q">{f.q}{f.help ? <small>{f.help}</small> : null}</div>; }
    else if (item.kind === 'a') {
      const value = shown(brief, item.field, client.first);
      const files = item.field === 'assetPlan' && brief.assetPlan === 'supplied' ? project.assets.filter(file => brief.assetIds.includes(file.id)) : [];
      bubble = <div className={`bub${value ? '' : ' skip'}`}>{value || 'Skipped'}
        {files.length ? <span className="attached">{files.map(file => <a key={file.id} href={`/api/portal/assets/${file.id}`} download>{file.name}</a>)}</span> : null}
        {canEdit ? <button className="edit" onClick={() => onEdit(item.field)}>Edit<span className="vh"> {field(item.field).label}</span></button> : null}</div>;
    } else bubble = <div className="bub">{item.text}</div>;
    return <div key={item.key} className={`msg${mine ? ' mine' : ''}${arrive}`}>{mine ? null : <span className="face" aria-hidden="true">{person.init}</span>}<span className="vh">{person.first}:</span>{bubble}</div>;
  })}</div></div>;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function Calendar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [today] = useState(() => iso(new Date()));
  const [month, setMonth] = useState(() => { const d = new Date(`${value || today}T00:00`); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(month.y, month.m, 1), lead = (first.getDay() + 6) % 7, days = new Date(month.y, month.m + 1, 0).getDate();
  const title = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), atStart = iso(first).slice(0, 7) === today.slice(0, 7);
  const move = (by: number) => { const next = new Date(month.y, month.m + by, 1); setMonth({ y: next.getFullYear(), m: next.getMonth() }); };
  function arrows(e: React.KeyboardEvent) {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    if (!step || !(e.target instanceof HTMLButtonElement)) return;
    e.preventDefault();
    const open = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
    open[open.indexOf(e.target) + step]?.focus();
  }
  return <><div className="cal">
    <div className="cal-top"><button type="button" aria-label="Previous month" disabled={atStart} onClick={() => move(-1)}><Chev d="M10 3 5 8l5 5" /></button><b aria-live="polite">{title}</b><button type="button" aria-label="Next month" onClick={() => move(1)}><Chev d="M6 3l5 5-5 5" /></button></div>
    <div className="cal-grid" role="group" aria-label={title} onKeyDown={arrows}>
      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(name => <span key={name} aria-hidden="true">{name}</span>)}
      {Array.from({ length: lead }, (_, i) => <i key={i} />)}
      {Array.from({ length: days }, (_, i) => { const d = iso(new Date(month.y, month.m, i + 1));
        return <button type="button" key={d} aria-label={day(d)} aria-pressed={value === d} className={d === today ? 'today' : undefined} disabled={d < today} onClick={() => onChange(value === d ? '' : d)}>{i + 1}</button>; })}
    </div></div>
    <p className="cal-pick">{value ? <>Launch by <b>{day(value)}</b></> : 'Pick a day, or skip.'}</p></>;
}

const PAGE_IDEAS = ['Home', 'About us', 'Our kitchens', 'Past projects', 'Prices', 'Contact', 'Journal'];
function Answer({ k, editing, project, state, busy, actions }: { k: FieldKey; editing: boolean; project: ProjectView; state: Progress; busy: boolean; actions: Actions }) {
  const brief = project.latestRevision.brief, f = field(k);
  const [text, setText] = useState(k === 'goal' || k === 'audience' || k === 'constraints' ? brief[k] : '');
  const [pages, setPages] = useState(brief.pages), [extra, setExtra] = useState('');
  const [who, setWho] = useState(brief.assetPlan), [ids, setIds] = useState(brief.assetIds), [fileError, setFileError] = useState('');
  const [date, setDate] = useState(brief.deadline ?? '');
  const patch: Partial<BriefInput> = k === 'pages' ? { pages } : k === 'assetPlan' ? { assetPlan: who, assetIds: who === 'supplied' ? ids : [] } : k === 'deadline' ? { deadline: date || null } : { [k]: text.trim() };
  const ok = k === 'pages' ? pages.length > 0 : k === 'assetPlan' ? who === 'create' || (who === 'supplied' && ids.length > 0) : k === 'deadline' ? !!date : !!text.trim();
  const changed = (Object.keys(patch) as (keyof BriefInput)[]).some(key => JSON.stringify(patch[key]) !== JSON.stringify(brief[key]));
  const ready = (ok || (editing && !f.need)) && !busy && (changed || !editing);
  const go = () => { if (ready) actions.answer(patch); };
  function addPage() {
    const name = extra.trim();
    if (name && pages.length < 10 && !pages.some(p => p.toLowerCase() === name.toLowerCase())) setPages([...pages, name]);
    setExtra('');
  }
  async function attach(file: File) {
    setFileError('');
    if (file.size > MAX_FILE_BYTES) { setFileError('That file is over 1.9 MB.'); return; }
    const asset = await actions.upload(file);
    if (asset) setIds(old => old.includes(asset.id) ? old : [...old, asset.id]);
  }
  async function sample() {
    try { await attach(new File([await (await fetch('/demo-asset.png')).blob()], 'sample-photo.png', { type: 'image/png' })); }
    catch { setFileError('The sample image could not be loaded.'); }
  }
  const uploaded = project.assets.filter(file => file.status === 'ready');
  return <>
    {editing ? <span className="editing">Editing: {f.label}</span> : null}
    {k === 'pages' ? <>
      <div className="ticks" role="group" aria-label="Pages">{[...PAGE_IDEAS, ...pages.filter(p => !PAGE_IDEAS.includes(p))].map(p => <label className="tick" key={p}><input type="checkbox" checked={pages.includes(p)} disabled={!pages.includes(p) && pages.length >= 10} onChange={e => setPages(e.target.checked ? [...pages, p] : pages.filter(x => x !== p))} />{p}</label>)}</div>
      <div className="add"><input type="text" aria-label="Another page" placeholder="Another page" maxLength={40} value={extra} onChange={e => setExtra(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPage(); } }} /><button type="button" className="btn plain" onClick={addPage}>Add</button></div>
    </> : k === 'assetPlan' ? <>
      <div className="picks" role="group" aria-label={f.label}>
        <button type="button" className="pick" aria-pressed={who === 'create'} onClick={() => setWho('create')}>{STUDIO} makes them<small>Photography and a logo tidy-up go on the quote.</small></button>
        <button type="button" className="pick" aria-pressed={who === 'supplied'} onClick={() => setWho('supplied')}>I&rsquo;ll send my own<small>Attach at least one file with this answer.</small></button>
      </div>
      {who === 'supplied' ? <div className="files">
        <label className="vh" htmlFor="file">Attach a file</label><input id="file" type="file" accept="image/png,image/jpeg,application/pdf" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void attach(file); e.target.value = ''; }} />
        {fileError ? <p className="err" role="alert">{fileError}</p> : null}
        {uploaded.length ? <ul>{uploaded.map(file => <li key={file.id}><label className="tick"><input type="checkbox" checked={ids.includes(file.id)} onChange={e => setIds(e.target.checked ? [...ids, file.id] : ids.filter(id => id !== file.id))} />{file.name}</label><span>{Math.ceil(file.size / 1024)} KB</span></li>)}</ul> : null}
        <p>PNG, JPEG or PDF. 1.9 MB each, five at most. <button type="button" className="link" disabled={busy} onClick={() => void sample()}>Use a sample image</button></p>
      </div> : null}
    </> : k === 'deadline' ? <Calendar value={date} onChange={setDate} />
      : <textarea aria-label={f.label} maxLength={2000} placeholder="Type your answer" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } }} />}
    <div className="row"><span className="hint">{editing ? '' : f.need ? `${plural(state.missing, 'required answer')} to go` : 'Optional'}</span>
      <div className="acts">{editing ? <button type="button" className="btn plain" onClick={() => actions.edit(null)}>Cancel</button> : !f.need ? <button type="button" className="btn plain" disabled={busy} onClick={() => actions.skip(k)}>Skip</button> : null}
        <button type="button" className="btn" disabled={!ready} onClick={go}>{editing ? 'Save' : 'Send answer'}</button></div></div>
  </>;
}

function Note({ label, send, busy, actions, onSend }: { label: string; send: string; busy: boolean; actions: Actions; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return <><textarea aria-label={label} placeholder={label} maxLength={1000} value={text} onChange={e => setText(e.target.value)} />
    <div className="row"><div className="acts"><button type="button" className="btn plain" onClick={() => actions.note(false)}>Cancel</button><button type="button" className="btn" disabled={busy || !text.trim()} onClick={() => onSend(text.trim())}>{send}</button></div></div></>;
}

export function Composer({ project, state, seat, edit, noting, busy, error, actions }: {
  project: ProjectView; state: Progress; seat: Seat; edit: FieldKey | null; noting: boolean; busy: boolean; error: ApiError | null; actions: Actions;
}) {
  const client = PEOPLE[state.client].first, studio = PEOPLE.owner.first, status = project.state;
  const k = seat === 'client' && status !== 'approved' ? edit ?? state.ask : null;
  // Move focus to the new control when the composer changes, but leave it alone on first load.
  const wrap = useRef<HTMLDivElement>(null), loaded = useRef(false), view = `${seat}-${status}-${k}-${noting}`;
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; return; }
    // With nothing to operate in the composer, focus goes to the thread so it is not dropped to the top of the page.
    (wrap.current?.querySelector<HTMLElement>('textarea,input:not([type=file]),.pick,.cal-grid button:not([disabled]),.btn:not([disabled])') ?? document.querySelector<HTMLElement>('.thread'))?.focus({ preventScroll: true });
  }, [view]);
  let body;
  if (seat === 'studio') {
    if (noting && status !== 'draft') body = <Note key={status} busy={busy} actions={actions} onSend={actions.handBack} label={status === 'submitted' ? `What should ${client} change?` : 'Why does it need reopening?'} send={status === 'submitted' ? 'Send back' : 'Reopen'} />;
    else if (status === 'draft') body = <p className="hint">{state.sent ? `Waiting for ${client}’s next version.` : `${client} hasn’t sent the brief yet.`}</p>;
    else if (status === 'approved') body = <p className="hint">Approved. The handoff is in the panel.</p>;
    else body = <div className="row flush"><span className="hint">Version {state.round} is waiting for you.</span><div className="acts"><button type="button" className="btn plain" disabled={busy} onClick={() => actions.note(true)}>Ask for changes</button><button type="button" className="btn" disabled={busy} onClick={actions.approve}>Approve version {state.round}</button></div></div>;
  } else if (k) body = <Answer key={`${k}-${!!edit}`} k={k} editing={!!edit} project={project} state={state} busy={busy} actions={actions} />;
  else if (status === 'submitted') body = <div className="row flush"><span className="hint">With {studio} now. Changing an answer takes it back until you send it again.</span><div className="acts"><button type="button" className="btn plain" disabled={busy} onClick={() => actions.seat('studio')}>See {studio}&rsquo;s view</button></div></div>;
  else if (status === 'approved') body = <p className="hint">{studio} approved version {state.round}.</p>;
  else body = <div className="row flush"><span className="hint">{state.handedBack && !state.edited ? 'Change an answer with its Edit link, then send it again.' : 'Ready when you are.'}</span><div className="acts"><button type="button" className="btn" disabled={busy || !canSend(project, state)} onClick={actions.send}>{sendLabel(state)}</button></div></div>;
  return <div className="composer"><div ref={wrap}>
    {error ? <p className="err" role="alert">{error.status === 409 ? 'The brief changed somewhere else. It is up to date now, so try that again.' : error.message}{actions.retry ? <button type="button" className="link" onClick={actions.retry}>Try again</button> : null}{error.status === 401 ? <button type="button" className="link" onClick={actions.restart}>Start a new demo</button> : null}</p> : null}
    {body}
  </div></div>;
}
