import { sqliteTable, text, integer, uniqueIndex, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(), created_at: integer('created_at').notNull(), expires_at: integer('expires_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), run_id: text('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  persona: text('persona').notNull(), csrf: text('csrf').notNull(),
});
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(), run_id: text('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }), name: text('name').notNull(),
});
export const memberships = sqliteTable('memberships', {
  run_id: text('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }), persona: text('persona').notNull(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }), role: text('role').notNull(),
}, t => [primaryKey({ columns: [t.run_id, t.persona, t.workspace_id] })]);
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), state: text('state').notNull(), token: integer('token').notNull(),
  latest_revision_id: text('latest_revision_id'), submitted_revision_id: text('submitted_revision_id'), accepted_revision_id: text('accepted_revision_id'),
});
export const versions = sqliteTable('versions', {
  id: text('id').primaryKey(), project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(), body: text('body').notNull(), actor: text('actor').notNull(), created_at: integer('created_at').notNull(),
}, t => [uniqueIndex('project_version').on(t.project_id, t.version)]);
export const requests = sqliteTable('requests', {
  id: text('id').primaryKey(), project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  rule_key: text('rule_key'), title: text('title').notNull(), explanation: text('explanation').notNull(),
  required: integer('required').notNull(), status: text('status').notNull(), actor: text('actor').notNull(), created_at: integer('created_at').notNull(),
}, t => [uniqueIndex('project_rule').on(t.project_id, t.rule_key)]);
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(), request_id: text('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  body: text('body').notNull(), actor: text('actor').notNull(), created_at: integer('created_at').notNull(),
});
export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(), project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  revision_id: text('revision_id').notNull().references(() => versions.id, { onDelete: 'cascade' }),
  actor: text('actor').notNull(), created_at: integer('created_at').notNull(),
}, t => [uniqueIndex('approved_revision').on(t.revision_id)]);
export const events = sqliteTable('events', {
  id: text('id').primaryKey(), project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  actor: text('actor').notNull(), action: text('action').notNull(), details: text('details').notNull(), created_at: integer('created_at').notNull(),
}, t => [index('project_timeline').on(t.project_id, t.created_at)]);
export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(), project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  persona: text('persona').notNull(), operation_key: text('operation_key').notNull(), digest: text('digest').notNull(),
  result: text('result').notNull(), created_at: integer('created_at').notNull(),
}, t => [uniqueIndex('scoped_operation').on(t.project_id, t.persona, t.operation_key)]);
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(), run_id: text('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  project_id: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  operation_key: text('operation_key').notNull(), storage_key: text('storage_key').notNull(), digest: text('digest').notNull(),
  name: text('name').notNull(), content_type: text('content_type').notNull(), size: integer('size').notNull(),
  status: text('status').notNull(), actor: text('actor').notNull(), created_at: integer('created_at').notNull(),
}, t => [uniqueIndex('asset_operation').on(t.project_id, t.operation_key)]);
