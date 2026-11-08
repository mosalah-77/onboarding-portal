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
    <p className="muted">Save an incomplete draft at any time. Complete the required inputs before submitting.</p>
    <form onSubmit={e => { e.preventDefault(); save(); }}>
      <fieldset disabled={locked || busy}>
        <label htmlFor="goal">Business goal <span className="field-note">Required to submit</span></label>
        <textarea id="goal" maxLength={2000} rows={3} value={draft.goal} onChange={e => setDraft({ ...draft, goal: e.target.value })} {...attributes('goal', 'goal-help')} />
        {message('goal')}
        <p id="goal-help" className="field-help">What should the website help people do?</p>
        <label htmlFor="audience">Intended audience <span className="field-note">Required to submit</span></label>
        <textarea id="audience" maxLength={2000} rows={3} value={draft.audience} onChange={e => setDraft({ ...draft, audience: e.target.value })} {...attributes('audience', 'audience-help')} />
        {message('audience')}
        <p id="audience-help" className="field-help">Describe who will use the website and what they need.</p>
        <label htmlFor="pages">Required pages <span className="field-note">One page per line</span></label>
        <textarea id="pages" rows={4} maxLength={810} value={draft.pages.join('\n')} onChange={e => setDraft({ ...draft, pages: e.target.value.split('\n') })} {...attributes('pages', 'pages-help')} />
        {message('pages')}
        <p id="pages-help" className="field-help">Up to 10 pages. Each name can have up to 80 characters.</p>
        <label htmlFor="constraints">Constraints <span className="field-note">Optional</span></label>
        <textarea {...attributes('constraints')} id="constraints" rows={2} maxLength={2000} value={draft.constraints} onChange={e => setDraft({ ...draft, constraints: e.target.value })} placeholder="For example, content or technical requirements" />
        {message('constraints')}
        <div className="field-pair">
          <div><label htmlFor="assetPlan">Asset plan <span className="field-note">Required</span></label>
            <select {...attributes('assetPlan')} id="assetPlan" value={draft.assetPlan} onChange={e => setDraft({ ...draft, assetPlan: e.target.value as BriefInput['assetPlan'] })}>
              <option value="">Choose an asset plan</option><option value="create">Assets need to be created</option><option value="supplied">Use supplied assets</option>
            </select>{message('assetPlan')}</div>
          <div><label htmlFor="deadline">Requested deadline <span className="field-note">Optional</span></label>
            <input {...attributes('deadline', 'deadline-help')} id="deadline" type="date" value={draft.deadline ?? ''} onChange={e => setDraft({ ...draft, deadline: e.target.value || null })} />{message('deadline')}
          </div>
        </div>
        <p id="deadline-help" className="field-help">A requested date is not a delivery promise.</p>
        <div id="assetIds" className="asset-section">
          <h3>Project files</h3>{message('assetIds')}<p className="field-help">Synthetic PNG, JPEG or PDF only. Up to 2 MiB each; five upload slots per project, including unfinished uploads.</p>
          {project.assets.length ? <ul className="file-list">{project.assets.map(file => <li key={file.id}>
            {file.status === 'ready' ? <><label className="check-label"><input type="checkbox" checked={draft.assetIds.includes(file.id)} onChange={e => setDraft({ ...draft, assetIds: e.target.checked ? [...draft.assetIds, file.id] : draft.assetIds.filter(id => id !== file.id) })} />Attach {file.name}</label><a href={`/api/portal/assets/${file.id}`} download>Download</a></> : <span>{file.name} · Upload unfinished. Select the same file to retry.</span>}
            <span className="file-size">{Math.ceil(file.size / 1024)} KB</span>
          </li>)}</ul> : <p className="empty-copy">No files uploaded. You can choose “Assets need to be created” without adding a file.</p>}
          <label htmlFor="file">Upload a synthetic file</label><input {...attributes('assetIds')} id="file" type="file" accept="image/png,image/jpeg,application/pdf" onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ''; }} />
          <p className="field-help"><a href="/demo-asset.png" download="synthetic-sample.png">Download the sample PNG</a>, then upload it here to try the file workflow. Save the brief to attach it.</p>
        </div>
      </fieldset>
      <div className="form-actions"><button className="primary" disabled={locked || busy} type="submit">Save draft</button><span className="muted">{locked ? 'The accepted brief is frozen.' : dirty ? 'Your edits are in this browser until saved.' : 'Every save creates a new version.'}</span></div>
    </form>
  </section>;
}
