export type BriefInput = {
  goal: string; audience: string; pages: string[]; constraints: string;
  assetPlan: 'supplied' | 'create' | ''; deadline: string | null; assetIds: string[];
};
export type Blocker = { key: string; field: keyof BriefInput; message: string };
export class PortalError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message); this.status = status; this.details = details;
  }
}
export function textValue(value: unknown, label: string, limit = 2000, required = false): string {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim()))
    throw new PortalError(422, `${label} must be ${required ? 'non-empty text' : 'text'} of at most ${limit} characters.`);
  return value.trim();
}
export function validateBrief(input: unknown): BriefInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PortalError(422, 'Enter a valid brief.');
  const b = input as Record<string, unknown>;
  function field<T>(name: keyof BriefInput, parse: () => T): T {
    try { return parse(); }
    catch (error) {
      if (error instanceof PortalError) throw new PortalError(error.status, error.message, [{ field: name, message: error.message }]);
      throw error;
    }
  }
  function list(value: unknown, name: string, count: number, length: number) {
    if (!Array.isArray(value) || value.length > count) throw new PortalError(422, `${name} accepts at most ${count} items.`);
    const items = value.map(x => textValue(x, name, length, true));
    if (new Set(items.map(x => x.toLowerCase())).size !== items.length) throw new PortalError(422, `${name} must not contain duplicates.`);
    return items;
  }
  const assetPlan = field('assetPlan', () => {
    if (!['', 'supplied', 'create'].includes(b.assetPlan as string)) throw new PortalError(422, 'Choose an asset plan.');
    return b.assetPlan as BriefInput['assetPlan'];
  });
  const deadline = field('deadline', () => {
  const value = b.deadline === undefined || b.deadline === null || b.deadline === '' ? null : textValue(b.deadline, 'Requested deadline', 10);
  return value;
  });
  if (deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || !Number.isFinite(Date.parse(deadline)) || new Date(deadline).toISOString().slice(0, 10) !== deadline))
    throw new PortalError(422, 'Enter a valid calendar date.', [{ field: 'deadline', message: 'Enter a valid calendar date.' }]);
  return {
    goal: field('goal', () => textValue(b.goal, 'Business goal')), audience: field('audience', () => textValue(b.audience, 'Audience')),
    pages: field('pages', () => list(b.pages, 'Pages', 10, 80)), constraints: field('constraints', () => textValue(b.constraints === undefined ? '' : b.constraints, 'Constraints')),
    assetPlan, deadline, assetIds: field('assetIds', () => list(b.assetIds ?? [], 'Assets', 5, 100)),
  };
}
export function readiness(b: BriefInput, readyAssetIds: Set<string>): Blocker[] {
  const blockers: Blocker[] = [];
  if (!b.goal.trim()) blockers.push({ key: 'goal.required', field: 'goal', message: 'Describe what the website needs to achieve.' });
  if (!b.audience.trim()) blockers.push({ key: 'audience.required', field: 'audience', message: 'Add the audience before submitting.' });
  if (!b.pages.length) blockers.push({ key: 'pages.required', field: 'pages', message: 'Add at least one page.' });
  if (!b.assetPlan) blockers.push({ key: 'assetPlan.required', field: 'assetPlan', message: 'Choose how the project will get its assets.' });
  if (b.assetPlan === 'supplied' && !b.assetIds.some(id => readyAssetIds.has(id))) blockers.push({ key: 'assets.required', field: 'assetIds', message: 'Attach at least one successfully uploaded asset.' });
  return blockers;
}
export function checklist(accepted: BriefInput) {
  return [
    ...accepted.pages.map((page, index) => ({ id: `page-${index}`, text: `Prepare the ${page} page`, source: `pages.${index}` })),
    { id: 'assets', text: accepted.assetPlan === 'create' ? 'Create the project assets' : 'Review the attached project assets', source: 'assetPlan' },
    { id: 'audience', text: 'Check the page content against the intended audience', source: 'audience' },
    { id: 'accessibility', text: 'Review responsive layouts and accessibility for the accepted pages', source: 'pages' },
    ...(accepted.constraints ? [{ id: 'constraints', text: 'Review the stated constraints before implementation', source: 'constraints' }] : []),
    ...(accepted.deadline
      ? [{ id: 'deadline', text: `Review the requested date: ${accepted.deadline}`, source: 'deadline' }]
      : [{ id: 'deadline', text: 'Agree a delivery date before scheduling work.', source: 'deadline' }]),
  ];
}
