// src/main/ipc/settings.handlers.ts
import { ipcMain } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { SettingsService, type AppSettings } from '../../application/services/settings.service';
import { IPC } from '../../shared/types/ipc';

let service: SettingsService | null = null;

function getService(): SettingsService {
  if (!service) service = new SettingsService(getDb());
  return service;
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getService().get();
  });

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, patch: Partial<AppSettings>) => {
    return getService().update(patch);
  });
}