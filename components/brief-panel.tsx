'use client';
import { useState } from 'react';
import type { ProjectView } from '@/lib/workflow';
import { FIELDS, PEOPLE, STUDIO, canSend, clock, filled, shown, summary, type FieldKey, type Progress, type Seat } from '@/lib/conversation';
import { Tick, sendLabel, type Actions } from './chat';

function download(project: ProjectView, state: Progress) {
  const accepted = project.acceptedRevision, client = PEOPLE[state.client].first;
  if (!accepted || !project.handoff) return;
  const files = project.assets.filter(file => accepted.brief.assetIds.includes(file.id)).map(file => file.name);
  const text = [`Handoff: ${project.name}, new website`, `Version ${state.round}, approved by ${PEOPLE.owner.name}`, '',
    ...FIELDS.map(f => `${f.label}: ${shown(accepted.brief, f.k, client) || 'none'}`), ...(files.length ? [`Attached files: ${files.join(', ')}`] : []),
    '', 'First jobs', ...project.handoff.tasks.map(task => `- ${task.text}`)].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  Object.assign(document.createElement('a'), { href: url, download: 'handoff.txt' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BriefPanel({ project, state, seat, canEdit, edit, busy, expiresAt, actions, startOver }: {
  project: ProjectView; state: Progress; seat: Seat; canEdit: boolean; edit: FieldKey | null; busy: boolean; expiresAt?: number; actions: Actions; startOver: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { stage, head, sub } = summary(project, state, seat), status = project.state, brief = project.latestRevision.brief;
  const client = PEOPLE[state.client].first, current = status === 'approved' ? null : edit ?? state.ask;
  const cls = (i: number) => i < stage || status === 'approved' ? 'done' : i === stage ? 'cur' : 'later';
  const dot = (i: number) => <span className="dot">{cls(i) === 'done' ? <Tick /> : null}</span>;
  const review = status === 'draft' ? (state.sent === 0 ? 'Not sent yet' : `Version ${state.round - 1} ${state.handedBack === 'returned' ? 'came back with a note' : state.handedBack === 'reopened' ? 'was reopened' : 'was taken back'}`)
    : `Version ${state.round}${state.sentAt ? `, sent ${clock(state.sentAt)}` : ''}`;
  return <aside className={`side${open ? ' open' : ''}`} aria-label="Brief summary">
    <button type="button" className="side-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>Brief v{state.round}<span>{head}</span></button>
    <div className="side-body">
      <div className="now"><small>{project.name} · version {state.round}</small><h2>{head}</h2><p>{sub}</p>
        {seat === 'client' && status === 'draft' ? <button type="button" className="btn" disabled={busy || !canSend(project, state)} onClick={actions.send}>{sendLabel(state)}</button> : null}
        {seat === 'studio' && status === 'submitted' ? <><button type="button" className="btn" disabled={busy} onClick={actions.approve}>Approve version {state.round}</button><button type="button" className="btn ghost" disabled={busy} onClick={() => actions.note(true)}>Ask for changes</button></> : null}
        {status === 'approved' ? <><button type="button" className="btn" onClick={() => download(project, state)}>Download handoff</button>{seat === 'studio' ? <button type="button" className="btn ghost" disabled={busy} onClick={() => actions.note(true)}>Reopen the brief</button> : null}</> : null}
      </div>
      <ol className="path">
        <li className={cls(0)}>{dot(0)}<h3>{client} answers</h3><ul className="answers">{FIELDS.map(f => {
          const done = filled(brief, f.k), asked = state.items.some(item => item.key === `a-${f.k}`), cur = current === f.k;
          const inner = <><span className="mk">{done ? <Tick /> : null}</span><span className="nm">{f.label}</span></>;
          return <li key={f.k} className={`${done ? 'ans' : ''}${cur ? ' asking' : ''}`}>{canEdit && asked && !cur ? <button type="button" onClick={() => actions.edit(f.k)}>{inner}<span className="vh">, edit</span></button> : inner}<em>{cur ? 'now' : done ? '' : asked ? 'skipped' : f.need ? '' : 'optional'}</em></li>;
        })}</ul></li>
        <li className={cls(1)}>{dot(1)}<h3>{STUDIO} reviews</h3><p>{review}</p></li>
        <li className={cls(2)}>{dot(2)}<h3>Approved, work starts</h3>{status === 'approved' && project.handoff ? <ul className="jobs">{project.handoff.tasks.map(task => <li key={task.id}>{task.text}</li>)}</ul> : <p>The studio gets a first-jobs list.</p>}</li>
      </ol>
      <p className="note">Portfolio demo by Mohamed Elmorshedy. The people and companies are made up.{expiresAt ? ` This demo expires ${new Date(expiresAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.` : ''}<br /><a href="/how-it-works">How it works</a><button type="button" className="link" disabled={busy} onClick={startOver}>Start over</button></p>
    </div>
  </aside>;
}
