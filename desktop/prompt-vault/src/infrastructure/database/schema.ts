import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ===== СПРАВОЧНИКИ =====

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

// ===== ОСНОВНАЯ СУЩНОСТЬ =====

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type', {
    enum: ['PROMPT', 'MASTER_PROMPT', 'SYSTEM_PROMPT', 'TEMPLATE', 'INSTRUCTION', 'SNIPPET'],
  }).notNull(),
  description: text('description'),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  }).notNull().default('ACTIVE'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),

  // ===== Master Prompt metadata (Stage 5) =====
  // Единая JSON-колонка. NULL для обычных промптов.
  // Структура: см. src/domain/models/master-prompt.ts → MasterMetadata
  masterMetadata: text('master_metadata'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  titleIdx: index('prompts_title_idx').on(table.title),
  projectIdx: index('prompts_project_idx').on(table.projectId),
  categoryIdx: index('prompts_category_idx').on(table.categoryId),
  statusIdx: index('prompts_status_idx').on(table.status),
  updatedAtIdx: index('prompts_updated_idx').on(table.updatedAt),
}));

// ===== СВЯЗИ МНОГИЕ-КО-МНОГИМ =====

export const promptTags = sqliteTable('prompt_tags', {
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: uniqueIndex('prompt_tags_pk').on(table.promptId, table.tagId),
}));

// ===== ВЕРСИОНИРОВАНИЕ =====

export const promptVersions = sqliteTable('prompt_versions', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  changeNote: text('change_note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  promptVersionIdx: uniqueIndex('prompt_versions_prompt_num_idx')
    .on(table.promptId, table.versionNumber),
}));

// ===== НАСТРОЙКИ =====

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON-строка
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ===== STAGE 8: ИСТОРИЯ НЕДАВНИХ ПРОМПТОВ =====

export const recentPrompts = sqliteTable('recent_prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  promptIdIdx: index('idx_recent_prompt_id').on(table.promptId),
  openedAtIdx: index('idx_recent_opened_at').on(table.openedAt),
}));