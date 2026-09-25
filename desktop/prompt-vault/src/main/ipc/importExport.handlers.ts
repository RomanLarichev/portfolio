// src/main/ipc/importExport.handlers.ts
import { ipcMain, dialog } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { ImportExportService } from '../../application/services/importExport.service';
import { IPC, type ExportOptions } from '../../shared/types/ipc';

let service: ImportExportService | null = null;

function getService(): ImportExportService {
  if (!service) service = new ImportExportService(getDb());
  return service;
}

export function registerImportExportHandlers() {
  // 1. Выбор файлов (возвращает массив путей благодаря multiSelections)
  ipcMain.handle('importExport:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите файлы для импорта',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'PromptVault Backup', extensions: ['json', 'md'] },
      ],
    });
    return result.canceled ? [] : result.filePaths;
  });

  // 2. Предпросмотр ОДНОГО файла (фронтенд вызывает это для каждого пути отдельно в цикле .map)
  ipcMain.handle(IPC.IMPORT_PREVIEW, async (_event, filePath: string) => {
    try {
      return await getService().importPreview(filePath);
    } catch (e: any) {
      return {
        format: 'markdown' as const,
        items: [],
        errors: [`Ошибка чтения ${filePath.split(/[/\\]/).pop()}: ${e.message}`],
      };
    }
  });

  // 3. Импорт ОДНОГО файла (фронтенд вызывает это для каждого пути отдельно в цикле for)
  ipcMain.handle(IPC.IMPORT_COMMIT, async (_event, filePath: string) => {
    try {
      return await getService().importCommit(filePath);
    } catch (e: any) {
      return {
        imported: 0,
        skipped: 0,
        errors: [`Ошибка импорта ${filePath.split(/[/\\]/).pop()}: ${e.message}`],
        newIds: [],
      };
    }
  });

  // 4. Экспорт всей библиотеки
  ipcMain.handle(IPC.EXPORT_ALL, async (_event, options: ExportOptions) => {
    return getService().exportAll(options);
  });

  // 5. Экспорт одного промпта
  ipcMain.handle(IPC.EXPORT_SINGLE, async (_event, promptId: string, options: ExportOptions) => {
    return getService().exportSingle(promptId, options);
  });

  // 6. Экспорт нескольких промптов
  ipcMain.handle(IPC.EXPORT_MULTIPLE, async (_event, promptIds: string[], options: ExportOptions) => {
    return getService().exportMultiple(promptIds, options);
  });
}