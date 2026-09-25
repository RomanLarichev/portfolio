// src/main/ipc/version.handlers.ts
import { ipcMain } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { VersionService } from '../../application/services/version.service';
import { IPC } from '../../shared/types/ipc';

let service: VersionService | null = null;

function getService(): VersionService {
  if (!service) service = new VersionService(getDb());
  return service;
}

export function registerVersionHandlers(): void {
  ipcMain.handle(IPC.VERSION_LIST, (_event, promptId: string) => {
    return getService().listByPromptId(promptId);
  });

  ipcMain.handle(IPC.VERSION_GET, (_event, versionId: string) => {
    return getService().getById(versionId);
  });

  ipcMain.handle(IPC.VERSION_DIFF, (_event, oldVersionId: string | null, newVersionId: string) => {
    return getService().diff(oldVersionId, newVersionId);
  });
}