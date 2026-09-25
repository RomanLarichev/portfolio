// src/shared/types/ipc.ts

export type PromptType = 'PROMPT' | 'MASTER_PROMPT' | 'SYSTEM_PROMPT' | 'TEMPLATE' | 'INSTRUCTION' | 'SNIPPET';
export type PromptStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface TagDTO {
  id: string;
  name: string;
}

export interface PromptVersionDTO {
  id: string;
  promptId: string;
  versionNumber: number;
  content: string;
  changeNote: string | null;
  createdAt: string;
}

export interface PromptDTO {
  id: string;
  title: string;
  content: string;
  type: PromptType;
  description: string | null;
  categoryId: string | null;
  projectId: string | null;
  status: PromptStatus;
  isFavorite: boolean;
  isArchived: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagDTO[];
  project?: ProjectDTO | null;
  category?: CategoryDTO | null;
}

export interface CreatePromptInput {
  title: string;
  content: string;
  type: PromptType;
  description?: string;
  categoryId?: string | null;
  projectId?: string | null;
  tagNames?: string[];
}

export interface UpdatePromptInput {
  id: string;
  title?: string;
  content?: string;
  type?: PromptType;
  description?: string;
  categoryId?: string | null;
  projectId?: string | null;
  tagNames?: string[];
}

export interface SearchOptions {
  query?: string;
  projectId?: string | 'none';
  categoryId?: string | 'none';
  tagIds?: string[];
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
  isArchived?: boolean;
  isFavorite?: boolean;
}

// Типы для diff
export type DiffLineType = 'added' | 'removed' | 'unchanged';
export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

// === Import/Export ===
export type ExportFormat = 'markdown' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeVersions?: boolean;
  includeTags?: boolean;
}

export interface ExportedPrompt {
  id: string;
  title: string;
  content: string;
  type: PromptType;
  description: string | null;
  categoryName: string | null;
  projectName: string | null;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersionDTO[];
}

export interface ExportResult {
  filename: string;
  content: string;
  count: number;
  format: ExportFormat;
}

export interface ImportPreviewItem {
  title: string;
  type: PromptType;
  description: string | null;
  contentPreview: string;
  tags: string[];
  categoryName: string | null;
  projectName: string | null;
  versionsCount: number;
  willCreateNew: boolean; // всегда true (DATA SAFETY)
}

export interface ImportPreviewResult {
  format: ExportFormat;
  items: ImportPreviewItem[];
  errors: string[];
}

export interface ImportCommitResult {
  imported: number;
  skipped: number;
  errors: string[];
  newIds: string[];
}

// ===== STAGE 8: Recent prompts =====

export interface RecentPromptDTO {
  promptId: string;
  openedAt: string;
  // Подгружаем данные промпта для отображения
  title?: string;
  type?: PromptType;
  updatedAt?: string | null;
}

// ===== STAGE 9: App settings =====

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  confirmBeforeDelete: boolean;
  language: 'ru' | 'en';
}

export const IPC = {
  // Prompts
  PROMPT_LIST: 'prompt:list',
  PROMPT_GET: 'prompt:get',
  PROMPT_CREATE: 'prompt:create',
  PROMPT_UPDATE: 'prompt:update',
  PROMPT_ARCHIVE: 'prompt:archive',
  PROMPT_RESTORE: 'prompt:restore',
  PROMPT_DELETE: 'prompt:delete',
  PROMPT_FAVORITE: 'prompt:favorite',
  PROMPT_BUMP_USAGE: 'prompt:bumpUsage',
  PROMPT_DUPLICATE: 'prompt:duplicate',
  // Versions
  VERSION_LIST: 'version:list',
  VERSION_GET: 'version:get',
  VERSION_RESTORE: 'version:restore',
  VERSION_DIFF: 'version:diff',
  // Projects
  PROJECT_LIST: 'project:list',
  PROJECT_CREATE: 'project:create',
  // Categories
  CATEGORY_LIST: 'category:list',
  CATEGORY_CREATE: 'category:create',
  // Tags
  TAG_LIST: 'tag:list',
  // === Import/Export ===
  EXPORT_SINGLE: 'importExport:exportSingle',
  EXPORT_MULTIPLE: 'importExport:exportMultiple',
  EXPORT_ALL: 'importExport:exportAll',
  IMPORT_PREVIEW: 'importExport:importPreview',
  IMPORT_COMMIT: 'importExport:importCommit',
  // === Stage 8: Recent ===
  RECENT_LIST: 'recent:list',
  RECENT_ADD: 'recent:add',
  RECENT_CLEAR: 'recent:clear',
  // === Stage 9: Settings ===
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
} as const;