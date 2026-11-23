import { readiness, type BriefInput } from '@/lib/brief';
import type { ProjectView } from '@/lib/workflow';

export function BriefEditor({ project, draft, setDraft, locked, busy, dirty, save, upload, errors }: {
  project: ProjectView; errors: { field: string; message: string }[]; draft: BriefInput; setDraft: (brief: BriefInput) => void;
  locked: boolean; busy: boolean; dirty: boolean; save: () => void; upload: (file: File) => void;
}) {
  const issues = [...errors, ...readiness({ ...draft, pages: draft.pages.filter(p => p.trim()) }, new Set(project.assets.filter(a => a.status === 'ready').map(a => a.id)))];
  const issue = (field: string) => issues.find(item => item.field === field);
  const attributes = (field: string, help?: string) => ({
    'aria-invalid': issue(field) ? true : undefined,
    'aria-describedby': [help, issue(field) ? `${field}-error` : ''].filter(Boolean).join(' ') || undefined,
  });
  const message = (field: string) => issue(field) ? <p id={`${field}-error`} className="field-error">{issue(field)!.message}</p> : null;
  return <section aria-labelledby="brief-title" className="editor">
    <div className="section-heading"><h2 id="brief-title">Website brief</h2><span className="muted">{dirty ? 'Unsaved changes' : `Saved version ${project.latestRevision.version}`}</span></div>
    <p className="muted">{locked ? 'This brief is approved and locked. The agency owner can reopen it if the scope changes.' : 'Save as often as you like, even half-finished. Only the fields marked Required must be filled before you submit.'}</p>
    <form onSubmit={e => { e.preventDefault(); save(); }}>
      <fieldset disabled={locked || busy}>
        <h3 className="group-title">The basics</h3>
        <label htmlFor="goal">Business goal <span className="field-note">Required</span></label>
        <textarea id="goal" maxLength={2000} rows={3} value={draft.goal} onChange={e => setDraft({ ...draft, goal: e.target.value })} {...attributes('goal', 'goal-help')} />
        {message('goal')}
        <p id="goal-help" className="field-help">What should the website help people do?</p>
        <label htmlFor="audience">Intended audience <span className="field-note">Required</span></label>
        <textarea id="audience" maxLength={2000} rows={3} value={draft.audience} onChange={e => setDraft({ ...draft, audience: e.target.value })} {...attributes('audience', 'audience-help')} />
        {message('audience')}
        <p id="audience-help" className="field-help">Describe who will use the website and what they need.</p>
        <h3 className="group-title">Scope</h3>
        <label htmlFor="pages">Pages the site needs <span className="field-note">Required</span></label>
        <textarea id="pages" rows={4} maxLength={810} value={draft.pages.join('\n')} onChange={e => setDraft({ ...draft, pages: e.target.value.split('\n') })} {...attributes('pages', 'pages-help')} />
        {message('pages')}
        <p id="pages-help" className="field-help">One page name per line, up to 10 pages.</p>
        <label htmlFor="constraints">Constraints <span className="field-note">Optional</span></label>
        <textarea {...attributes('constraints')} id="constraints" rows={2} maxLength={2000} value={draft.constraints} onChange={e => setDraft({ ...draft, constraints: e.target.value })} placeholder="For example, content or technical requirements" />
        {message('constraints')}
        <h3 className="group-title">Assets and timing</h3>
        <div className="field-pair">
          <div><label htmlFor="assetPlan">Images and files <span className="field-note">Required</span></label>
            <select {...attributes('assetPlan')} id="assetPlan" value={draft.assetPlan} onChange={e => setDraft({ ...draft, assetPlan: e.target.value as BriefInput['assetPlan'] })}>
              <option value="">Choose one</option><option value="create">The agency creates them</option><option value="supplied">I will supply them</option>
            </select>{message('assetPlan')}</div>
          <div><label htmlFor="deadline">Requested deadline <span className="field-note">Optional</span></label>
            <input {...attributes('deadline', 'deadline-help')} id="deadline" type="date" value={draft.deadline ?? ''} onChange={e => setDraft({ ...draft, deadline: e.target.value || null })} />{message('deadline')}
          </div>
        </div>
        <p id="deadline-help" className="field-help">The date is a request. The agency still has to agree a delivery date.</p>
        <div id="assetIds" className="asset-section">
          <h3 className="group-title">Project files</h3>{message('assetIds')}<p className="field-help">PNG, JPEG or PDF, up to 2 MB each and five files per project. Use made-up demo files only.</p>
          {project.assets.length ? <ul className="file-list">{project.assets.map(file => <li key={file.id}>
            {file.status === 'ready' ? <><label className="check-label"><input type="checkbox" checked={draft.assetIds.includes(file.id)} onChange={e => setDraft({ ...draft, assetIds: e.target.checked ? [...draft.assetIds, file.id] : draft.assetIds.filter(id => id !== file.id) })} />Attach {file.name}</label><a href={`/api/portal/assets/${file.id}`} download>Download</a></> : <span>{file.name} · Upload did not finish. Choose the same file again to retry.</span>}
            <span className="file-size">{Math.ceil(file.size / 1024)} KB</span>
          </li>)}</ul> : <p className="empty-copy">No files yet. You only need one if you chose to supply the images and files yourself.</p>}
          {locked ? null : <><label htmlFor="file">Upload a file</label><input {...attributes('assetIds')} id="file" type="file" accept="image/png,image/jpeg,application/pdf" onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ''; }} />
          <p className="field-help">Nothing to hand? <a href="/demo-asset.png" download="synthetic-sample.png">Download the sample PNG</a> and upload it here.</p></>}
        </div>
      </fieldset>
      {locked ? null : <div className="form-actions"><button className="primary" disabled={busy} type="submit">Save draft</button><span className="muted">{dirty ? 'Unsaved edits live only in this tab.' : 'Each save is kept as a new version.'}</span></div>}
    </form>
  </section>;
}
