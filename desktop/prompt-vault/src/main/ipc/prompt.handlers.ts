// src/main/ipc/prompt.handlers.ts
import { ipcMain } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { PromptService } from '../../application/services/prompt.service';
import { IPC, type SearchOptions, type CreatePromptInput, type UpdatePromptInput } from '../../shared/types/ipc';

let service: PromptService | null = null;

function getService(): PromptService {
  if (!service) service = new PromptService(getDb());
  return service;
}

export function registerPromptHandlers(): void {
  ipcMain.handle(IPC.PROMPT_LIST, (_event, options: SearchOptions) => {
    return getService().list(options);
  });

  ipcMain.handle(IPC.PROMPT_GET, (_event, id: string) => {
    return getService().getById(id);
  });

  ipcMain.handle(IPC.PROMPT_CREATE, (_event, input: CreatePromptInput) => {
    return getService().create(input);
  });

  ipcMain.handle(IPC.PROMPT_UPDATE, (_event, input: UpdatePromptInput) => {
    return getService().update(input);
  });

  ipcMain.handle(IPC.PROMPT_ARCHIVE, (_event, id: string) => {
    return getService().archive(id);
  });

  ipcMain.handle(IPC.PROMPT_RESTORE, (_event, id: string) => {
    return getService().restore(id);
  });

  ipcMain.handle(IPC.PROMPT_DELETE, (_event, id: string) => {
    return getService().deletePermanently(id);
  });

  ipcMain.handle(IPC.PROMPT_FAVORITE, (_event, id: string) => {
    return getService().toggleFavorite(id);
  });

  ipcMain.handle(IPC.PROMPT_BUMP_USAGE, (_event, id: string) => {
    return getService().bumpUsage(id);
  });

  // НОВОЕ: Duplicate
  ipcMain.handle(IPC.PROMPT_DUPLICATE, (_event, id: string) => {
    return getService().duplicate(id);
  });

  // НОВОЕ: Restore version
  ipcMain.handle(IPC.VERSION_RESTORE, (_event, promptId: string, versionId: string) => {
    return getService().restoreVersion(promptId, versionId);
  });
}