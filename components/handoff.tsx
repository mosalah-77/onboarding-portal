import type { ProjectView, Revision } from '@/lib/workflow';

export function BriefFacts({ revision, prefix }: { revision: Revision; prefix: string }) {
  const b = revision.brief;
  return <dl className="facts">
    <div id={`${prefix}-goal`}><dt>Business goal</dt><dd>{b.goal || 'Missing'}</dd></div>
    <div id={`${prefix}-audience`}><dt>Audience</dt><dd>{b.audience || 'Missing'}</dd></div>
    <div id={`${prefix}-pages`}><dt>Pages</dt><dd><ul>{b.pages.map((page, i) => <li key={i} id={`${prefix}-pages.${i}`}>{page}</li>)}</ul></dd></div>
    <div id={`${prefix}-constraints`}><dt>Constraints</dt><dd>{b.constraints || 'None entered'}</dd></div>
    <div id={`${prefix}-assetPlan`}><dt>Images and files</dt><dd>{b.assetPlan === 'create' ? 'The agency creates them' : b.assetPlan === 'supplied' ? 'The client supplies them' : 'Missing'}</dd></div>
    <div id={`${prefix}-deadline`}><dt>Requested deadline</dt><dd>{b.deadline || 'Not agreed'}</dd></div>
    {b.assetIds.length ? <div><dt>Attached files</dt><dd><ul>{b.assetIds.map((id, i) => <li key={id}><a href={`/api/portal/assets/${id}`} download>Download attached file {i + 1}</a></li>)}</ul></dd></div> : null}
  </dl>;
}
export function Handoff({ project }: { project: ProjectView }) {
  const h = project.handoff, revision = project.acceptedRevision;
  if (!h || !revision) return <section className="handoff empty-copy" id="handoff"><h2>Approved handoff</h2><p>Nothing here yet. Once the agency owner approves a submitted version, the agreed scope and a starter checklist appear here.</p></section>;
  function download() {
    if (!h) return;
    const text = [`SYNTHETIC PORTFOLIO DEMO`, `${project.name} · Approved version ${h.version}`, `Goal: ${h.goal}`, `Audience: ${h.audience}`, `Pages: ${h.pages.join(', ')}`, `Constraints: ${h.constraints || 'None entered'}`, `Requested deadline: ${h.deadline} (not a delivery promise)`, `Images and files: ${h.assetPlan === 'create' ? 'The agency creates them' : 'The client supplies them'}`, `Attached file IDs: ${h.assetIds.join(', ') || 'None'}`, '', 'Suggested delivery checklist (review before planning delivery):', ...h.tasks.map(t => `[ ] ${t.text} (source: ${t.source})`)].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = `approved-brief-v${h.version}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="handoff" id="handoff" aria-labelledby="handoff-title">
    <div className="section-heading"><h2 id="handoff-title">Approved handoff</h2><span className="status approved">Version {revision.version}</span></div>
    <p>{project.state === 'approved' ? 'This is the exact version the owner approved.' : 'This approved scope still applies while the newer draft waits for review.'} A requested date still needs a delivery agreement.</p>
    <BriefFacts revision={revision} prefix="accepted" />
    <h3>Suggested delivery checklist</h3><p className="muted">Review these tasks before planning delivery.</p><ol className="checklist">{h.tasks.map(task => <li key={task.id}>{task.text} <a href={`#accepted-${task.source}`}>Source fact</a></li>)}</ol>
    <button onClick={download}>Download handoff as text</button>
  </section>;
}
