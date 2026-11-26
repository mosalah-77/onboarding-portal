import type { BriefInput } from './brief.ts';
import type { ProjectView } from './workflow.ts';

// The interface shows a brief as a conversation. Everything here is derived from the saved project,
// so a reload, or the other seat, sees the same thread.
export type FieldKey = 'goal' | 'audience' | 'pages' | 'assetPlan' | 'deadline' | 'constraints';
export type Seat = 'client' | 'studio';
export const STUDIO = 'Silverhand Studio';
export const PEOPLE: Record<string, { name: string; first: string; init: string }> = {
  'client-a': { name: 'Jackie Welles', first: 'Jackie', init: 'JW' },
  'client-b': { name: 'Priya Nair', first: 'Priya', init: 'PN' },
  owner: { name: 'Viktor Vektor', first: 'Viktor', init: 'VV' },
};
export const FIELDS: { k: FieldKey; label: string; q: string; help?: string; need?: boolean }[] = [
  { k: 'goal', label: 'Goal', q: 'What should the website do for the business?', help: 'More bookings, fewer phone calls, quotes online.', need: true },
  { k: 'audience', label: 'Audience', q: 'Who are you trying to reach?', need: true },
  { k: 'pages', label: 'Pages', q: 'Which pages do you want?', need: true },
  { k: 'assetPlan', label: 'Photos and logo', q: 'Who is supplying the photos and logo?', need: true },
  { k: 'deadline', label: 'Launch date', q: 'Is there a date you need it by?' },
  { k: 'constraints', label: 'Anything else', q: 'Anything else I should know?' },
];
export const field = (k: FieldKey) => FIELDS.find(f => f.k === k)!;
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const clock = (time: number) => new Date(time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
export const day = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export function filled(brief: BriefInput, k: FieldKey) {
  const value = brief[k];
  return Array.isArray(value) ? value.length > 0 : !!value?.trim();
}
export function shown(brief: BriefInput, k: FieldKey, clientFirst: string) {
  if (k === 'pages') return brief.pages.join(', ');
  if (k === 'assetPlan') return brief.assetPlan === 'create' ? `${STUDIO} makes them` : brief.assetPlan === 'supplied' ? `${clientFirst} sends the files` : '';
  if (k === 'deadline') return brief.deadline ? day(brief.deadline) : '';
  return brief[k];
}

export type Item =
  | { key: string; kind: 'text'; from: Seat; text: string; late?: boolean }
  | { key: string; kind: 'q'; field: FieldKey; late?: boolean }
  | { key: string; kind: 'a'; field: FieldKey }
  | { key: string; kind: 'event'; text: string }
  | { key: string; kind: 'approved'; round: number; at: number };
export type Progress = {
  client: string; sent: number; round: number; ask: FieldKey | null; missing: number; edited: boolean;
  handedBack: 'returned' | 'reopened' | 'withdrawn' | null; sentAt: number | null; approvedAt: number | null; items: Item[];
};
const changedLabel: Record<string, string> = { goal: 'Goal', audience: 'Audience', pages: 'Pages', assetPlan: 'Photos and logo', assetIds: 'Photos and logo', deadline: 'Launch date', constraints: 'Anything else' };

// "Version" in the interface counts the times a brief has been sent. Each answer is still saved as its own
// revision on the server, and approval names one of those revisions by ID.
export function progress(project: ProjectView, skipped: FieldKey[] = []): Progress {
  const acts = [...project.activity].reverse(), brief = project.latestRevision.brief;
  const client = project.revisions[0]?.actor ?? 'client-a', who = PEOPLE[client]?.first ?? 'The client', studio = PEOPLE.owner.first;
  const items: Item[] = [{ key: 'hi', kind: 'text', from: 'studio', text: `Hi ${who}. Four questions and I can put a quote together. There are two optional ones after that.` }];
  const sent = acts.filter(e => e.action === 'brief_submitted').length, firstPass = project.state === 'draft' && sent === 0;
  const ask = firstPass ? FIELDS.find(f => !filled(brief, f.k) && !skipped.includes(f.k))?.k ?? null : null;
  for (const f of FIELDS) {
    items.push({ key: `q-${f.k}`, kind: 'q', field: f.k, late: f !== FIELDS[0] });
    if (f.k === ask) break;
    items.push({ key: `a-${f.k}`, kind: 'a', field: f.k });
  }
  if (!ask) items.push({ key: 'done', kind: 'text', from: 'studio', text: "That's all I need. Look over the summary and send it across when you're happy.", late: true });
  let round = 0, last = '', handedBack: Progress['handedBack'] = null, sentAt: number | null = null, approvedAt: number | null = null;
  for (const e of acts) {
    if (e.action === 'brief_submitted') { round++; sentAt = e.createdAt; handedBack = 'withdrawn'; items.push({ key: e.id, kind: 'event', text: `${who} sent version ${round} at ${clock(e.createdAt)}` }); }
    else if (e.action === 'brief_returned' || e.action === 'brief_reopened') {
      handedBack = e.action === 'brief_returned' ? 'returned' : 'reopened';
      items.push({ key: e.id, kind: 'event', text: `${studio} ${handedBack === 'returned' ? `sent version ${round} back` : `reopened version ${round}`}` });
      items.push({ key: `${e.id}-why`, kind: 'text', from: 'studio', text: String(e.details.reason ?? '') });
    } else if (e.action === 'brief_approved') { approvedAt = e.createdAt; items.push({ key: e.id, kind: 'approved', round, at: e.createdAt }); }
    else if (e.action === 'brief_saved' && round > 0) {
      const labels = [...new Set((Array.isArray(e.details.fields) ? e.details.fields : []).map(x => changedLabel[String(x)]).filter(Boolean))];
      items.push({ key: e.id, kind: 'event', text: `${who} changed ${labels.join(', ').toLowerCase() || 'the brief'}` });
    } else continue;
    last = e.action;
  }
  return {
    client, sent, round: project.state === 'draft' ? sent + 1 : sent, ask, missing: FIELDS.filter(f => f.need && !filled(brief, f.k)).length,
    edited: last === 'brief_saved', handedBack: project.state === 'draft' ? handedBack : null, sentAt, approvedAt, items,
  };
}
export function canSend(project: ProjectView, p: Progress) {
  return project.state === 'draft' && !p.ask && !project.blockers.length && (p.sent === 0 || p.edited);
}
export function summary(project: ProjectView, p: Progress, seat: Seat): { stage: 0 | 1 | 2; head: string; sub: string } {
  const who = PEOPLE[p.client]?.first ?? 'The client', studio = PEOPLE.owner;
  if (project.state === 'approved') return { stage: 2, head: 'Approved', sub: `${studio.name}${p.approvedAt ? `, ${clock(p.approvedAt)}` : ''}` };
  if (project.state === 'submitted') return { stage: 1, head: `With ${STUDIO}`, sub: `${studio.first} is reading version ${p.round}.` };
  const optional = FIELDS.filter(f => !f.need && !p.items.some(item => item.key === `a-${f.k}`)).length;
  if (seat === 'studio' && p.sent === 0) return { stage: 0, head: 'Not sent yet', sub: p.missing ? `${plural(p.missing, 'required answer')} still missing.` : 'Every required answer is in.' };
  const head = p.handedBack === 'returned' ? 'Sent back for changes' : p.handedBack === 'reopened' ? 'Reopened for changes' : p.handedBack ? 'Back in draft'
    : p.missing ? `${plural(p.missing, 'answer')} to go` : p.ask ? 'Almost there' : 'Ready to send';
  const sub = seat === 'studio' ? (p.edited ? `${who} is changing it.` : `Waiting for ${who}.`)
    : p.handedBack ? (p.edited ? 'Changed. Send it again when ready.' : `${studio.first} ${p.handedBack === 'returned' ? 'asked for a change' : 'reopened the approved brief'}.`)
    : p.missing ? `${studio.first} can quote once the four required answers are in.` : p.ask ? `Answer or skip the ${optional === 1 ? 'last optional question' : `${optional} optional questions`}, then send it.` : `Send it to ${studio.first} when you're happy.`;
  return { stage: 0, head, sub };
}
