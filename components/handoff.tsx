import type { ProjectView, Revision } from '@/lib/workflow';

export function BriefFacts({ revision, prefix }: { revision: Revision; prefix: string }) {
  const b = revision.brief;
  return <dl className="facts">
    <div id={`${prefix}-goal`}><dt>Business goal</dt><dd>{b.goal || 'Missing'}</dd></div>
    <div id={`${prefix}-audience`}><dt>Audience</dt><dd>{b.audience || 'Missing'}</dd></div>
    <div id={`${prefix}-pages`}><dt>Pages</dt><dd><ul>{b.pages.map((page, i) => <li key={i} id={`${prefix}-pages.${i}`}>{page}</li>)}</ul></dd></div>
    <div id={`${prefix}-constraints`}><dt>Constraints</dt><dd>{b.constraints || 'None entered'}</dd></div>
    <div id={`${prefix}-assetPlan`}><dt>Assets</dt><dd>{b.assetPlan === 'create' ? 'Assets need to be created' : b.assetPlan === 'supplied' ? 'Use supplied assets' : 'Missing'}</dd></div>
    <div id={`${prefix}-deadline`}><dt>Requested deadline</dt><dd>{b.deadline || 'Not agreed'}</dd></div>
    {b.assetIds.length ? <div><dt>Attached files</dt><dd><ul>{b.assetIds.map((id, i) => <li key={id}><a href={`/api/portal/assets/${id}`} download>Download accepted file {i + 1}</a></li>)}</ul></dd></div> : null}
  </dl>;
}
export function Handoff({ project }: { project: ProjectView }) {
  const h = project.handoff, revision = project.acceptedRevision;
  if (!h || !revision) return <section className="handoff empty-copy" id="handoff"><h2>Accepted handoff</h2><p>The owner must approve a submitted version before a handoff is available.</p></section>;
  function download() {
    if (!h) return;
    const text = [`SYNTHETIC PORTFOLIO DEMO`, `${project.name} · Accepted version ${h.version}`, `Goal: ${h.goal}`, `Audience: ${h.audience}`, `Pages: ${h.pages.join(', ')}`, `Constraints: ${h.constraints || 'None entered'}`, `Requested deadline: ${h.deadline} (not a delivery promise)`, `Asset plan: ${h.assetPlan}`, `Attached asset IDs: ${h.assetIds.join(', ') || 'None'}`, '', 'Suggested delivery checklist (review before planning delivery):', ...h.tasks.map(t => `[ ] ${t.text} (source: ${t.source})`)].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = `accepted-brief-v${h.version}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="handoff" id="handoff" aria-labelledby="handoff-title">
    <div className="section-heading"><h2 id="handoff-title">Accepted handoff</h2><span className="status approved">Version {revision.version}</span></div>
    <p>{project.state === 'approved' ? 'This is the version the owner approved.' : 'This accepted scope stays in place while the new draft awaits review.'} A requested date still needs a delivery agreement.</p>
    <BriefFacts revision={revision} prefix="accepted" />
    <h3>Suggested delivery checklist</h3><p className="muted">Review these tasks before planning delivery.</p><ol className="checklist">{h.tasks.map(task => <li key={task.id}>{task.text} <a href={`#accepted-${task.source}`}>Source fact</a></li>)}</ol>
    <button onClick={download}>Download handoff</button>
  </section>;
}
