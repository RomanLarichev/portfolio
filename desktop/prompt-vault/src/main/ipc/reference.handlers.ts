import { ipcMain } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { ReferenceService } from '../../application/services/reference.service';
import { IPC } from '../../shared/types/ipc';

let service: ReferenceService | null = null;
function getService() {
  if (!service) service = new ReferenceService(getDb());
  return service;
}

export function registerReferenceHandlers() {
  ipcMain.handle(IPC.PROJECT_LIST, () => getService().listProjects());
  ipcMain.handle(IPC.PROJECT_CREATE, (_e, name: string, desc?: string) => getService().createProject(name, desc));
  
  ipcMain.handle(IPC.CATEGORY_LIST, () => getService().listCategories());
  ipcMain.handle(IPC.CATEGORY_CREATE, (_e, name: string, color?: string) => getService().createCategory(name, color));
  
  ipcMain.handle(IPC.TAG_LIST, () => getService().listTags());
}