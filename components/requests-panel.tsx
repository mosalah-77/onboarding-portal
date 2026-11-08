import { useState } from 'react';
import type { ProjectView, RequestView } from '@/lib/workflow';

export type Mutate = (path: string, body: Record<string, unknown>, success: string, onSuccess?: () => void) => Promise<boolean>;
type Dirty = (key: string, value: boolean) => void;
function RequestItem({ request, owner, busy, token, mutate, onDirty }: { request: RequestView; owner: boolean; busy: boolean; token: number; mutate: Mutate; onDirty: Dirty }) {
  const [text, setText] = useState('');
  async function send(resolve: boolean) {
    await mutate(`/requests/${request.id}/${resolve ? 'resolve' : 'comments'}`, resolve ? { explanation: text, expectedToken: token } : { text }, resolve ? 'Request resolved with your explanation.' : 'Comment saved.', () => { setText(''); onDirty(request.id, false); });
  }
  return <details className="request" open={request.status === 'open'}>
    <summary><span>{request.title}</span><span className={`status ${request.status === 'resolved' ? 'approved' : 'waiting'}`}>{request.status === 'resolved' ? 'Resolved' : request.required ? 'Required' : 'Optional'}</span></summary>
    <p>{request.explanation}</p>
    {request.comments.map(comment => <div className="comment" key={comment.id}><strong>{comment.actor === 'owner' ? 'Agency owner' : comment.actor === 'client-a' ? 'Client A' : 'Client B'}</strong><p>{comment.text}</p></div>)}
    <form onSubmit={e => { e.preventDefault(); void send(false); }}>
      <label htmlFor={`comment-${request.id}`}>{owner && !request.ruleKey && request.status === 'open' ? 'Comment or resolution explanation' : 'Add a comment'}</label>
      <textarea id={`comment-${request.id}`} rows={2} maxLength={2000} required value={text} onChange={e => { setText(e.target.value); onDirty(request.id, !!e.target.value); }} disabled={busy} />
      <div className="button-row"><button type="submit" disabled={busy || !text.trim()}>Add comment</button>{owner && !request.ruleKey && request.status === 'open' ? <button type="button" disabled={busy || !text.trim()} onClick={() => void send(true)}>Resolve request</button> : null}</div>
    </form>
  </details>;
}
export function RequestsPanel({ project, owner, busy, mutate, onDirty }: { project: ProjectView; owner: boolean; busy: boolean; mutate: Mutate; onDirty: Dirty }) {
  const [title, setTitle] = useState(''), [explanation, setExplanation] = useState(''), [required, setRequired] = useState(true);
  return <section aria-labelledby="requests-title" id="requests">
    <h2 id="requests-title">Information requests</h2>
    <p className="muted">Field requests resolve when you save the missing input. The owner resolves their own requests with an explanation.</p>
    {project.requests.length ? project.requests.map(request => <RequestItem key={request.id} request={request} owner={owner} busy={busy} token={project.token} mutate={mutate} onDirty={onDirty} />) : <p className="empty-copy">No information requests. The brief is ready for its next review.</p>}
    {owner && project.state !== 'approved' ? <details className="request"><summary>Request more information</summary><form onSubmit={async e => {
      e.preventDefault(); await mutate(`/projects/${project.id}/requests`, { title, explanation, required, expectedToken: project.token }, 'Information request added.', () => { setTitle(''); setExplanation(''); onDirty('new-request', false); });
    }}><fieldset disabled={busy}>
      <label htmlFor="request-title">Request title</label><input id="request-title" required maxLength={160} value={title} onChange={e => { setTitle(e.target.value); onDirty('new-request', !!e.target.value || !!explanation); }} />
      <label htmlFor="request-explanation">What is missing?</label><textarea id="request-explanation" required maxLength={2000} rows={3} value={explanation} onChange={e => { setExplanation(e.target.value); onDirty('new-request', !!e.target.value || !!title); }} />
      <label className="check-label"><input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />Required before approval</label>
      <button type="submit">Add request</button>
    </fieldset></form></details> : null}
  </section>;
}
