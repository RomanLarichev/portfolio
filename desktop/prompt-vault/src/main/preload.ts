// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type {
  PromptDTO,
  CreatePromptInput,
  UpdatePromptInput,
  PromptVersionDTO,
  DiffResult,
  ExportOptions,
  ExportResult,
  ImportPreviewResult,
  ImportCommitResult,
  RecentPromptDTO,
  AppSettings,
} from '../shared/types/ipc';
import { IPC } from '../shared/types/ipc';

const promptAPI = {
  list: (options: any): Promise<PromptDTO[]> =>
    ipcRenderer.invoke(IPC.PROMPT_LIST, options),
  get: (id: string): Promise<PromptDTO | null> =>
    ipcRenderer.invoke(IPC.PROMPT_GET, id),
  create: (input: CreatePromptInput): Promise<PromptDTO> =>
    ipcRenderer.invoke(IPC.PROMPT_CREATE, input),
  update: (input: UpdatePromptInput): Promise<PromptDTO> =>
    ipcRenderer.invoke(IPC.PROMPT_UPDATE, input),
  archive: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PROMPT_ARCHIVE, id),
  restore: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PROMPT_RESTORE, id),
  deletePermanently: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PROMPT_DELETE, id),
  toggleFavorite: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PROMPT_FAVORITE, id),
  bumpUsage: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PROMPT_BUMP_USAGE, id),
  duplicate: (id: string): Promise<PromptDTO> =>
    ipcRenderer.invoke(IPC.PROMPT_DUPLICATE, id),
  restoreVersion: (promptId: string, versionId: string): Promise<PromptDTO> =>
    ipcRenderer.invoke(IPC.VERSION_RESTORE, promptId, versionId),
};

const referenceAPI = {
  listProjects: () => ipcRenderer.invoke(IPC.PROJECT_LIST),
  createProject: (name: string, desc?: string) =>
    ipcRenderer.invoke(IPC.PROJECT_CREATE, name, desc),
  listCategories: () => ipcRenderer.invoke(IPC.CATEGORY_LIST),
  createCategory: (name: string, color?: string) =>
    ipcRenderer.invoke(IPC.CATEGORY_CREATE, name, color),
  listTags: () => ipcRenderer.invoke(IPC.TAG_LIST),
};

const versionAPI = {
  list: (promptId: string): Promise<PromptVersionDTO[]> =>
    ipcRenderer.invoke(IPC.VERSION_LIST, promptId),
  get: (versionId: string): Promise<PromptVersionDTO | null> =>
    ipcRenderer.invoke(IPC.VERSION_GET, versionId),
  diff: (oldVersionId: string | null, newVersionId: string): Promise<DiffResult> =>
    ipcRenderer.invoke(IPC.VERSION_DIFF, oldVersionId, newVersionId),
};

// === Import/Export API (Stage 7) ===
const importExportAPI = {
  selectFile: (): Promise<string | null> =>
    ipcRenderer.invoke('importExport:selectFile'),
  exportAll: (options: ExportOptions): Promise<ExportResult | null> =>
    ipcRenderer.invoke(IPC.EXPORT_ALL, options),
  exportSingle: (promptId: string, options: ExportOptions): Promise<ExportResult | null> =>
    ipcRenderer.invoke(IPC.EXPORT_SINGLE, promptId, options),
  exportMultiple: (promptIds: string[], options: ExportOptions): Promise<ExportResult | null> =>
    ipcRenderer.invoke(IPC.EXPORT_MULTIPLE, promptIds, options),
  importPreview: (filePath: string): Promise<ImportPreviewResult> =>
    ipcRenderer.invoke(IPC.IMPORT_PREVIEW, filePath),
  importCommit: (filePath: string): Promise<ImportCommitResult> =>
    ipcRenderer.invoke(IPC.IMPORT_COMMIT, filePath),
};

// === Stage 8: Recent API ===
const recentAPI = {
  list: (): Promise<RecentPromptDTO[]> =>
    ipcRenderer.invoke(IPC.RECENT_LIST),
  add: (promptId: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.RECENT_ADD, promptId),
  clear: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC.RECENT_CLEAR),
};

// === Stage 9: Settings API ===
const settingsAPI = {
  get: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_GET),
  update: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_UPDATE, patch),
};

declare global {
  interface Window {
    promptAPI: typeof promptAPI;
    referenceAPI: typeof referenceAPI;
    versionAPI: typeof versionAPI;
    importExportAPI: typeof importExportAPI;
    recentAPI: typeof recentAPI;
    settingsAPI: typeof settingsAPI;
  }
}

contextBridge.exposeInMainWorld('promptAPI', promptAPI);
contextBridge.exposeInMainWorld('referenceAPI', referenceAPI);
contextBridge.exposeInMainWorld('versionAPI', versionAPI);
contextBridge.exposeInMainWorld('importExportAPI', importExportAPI);
contextBridge.exposeInMainWorld('recentAPI', recentAPI);
contextBridge.exposeInMainWorld('settingsAPI', settingsAPI);