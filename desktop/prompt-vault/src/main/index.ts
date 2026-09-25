// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeDatabase, closeDatabase } from '../infrastructure/database/connection';
import { registerPromptHandlers } from './ipc/prompt.handlers';
import { registerReferenceHandlers } from './ipc/reference.handlers';
import { registerVersionHandlers } from './ipc/version.handlers';
import { registerImportExportHandlers } from './ipc/importExport.handlers';
import { registerRecentHandlers } from './ipc/recent.handlers';
import { registerSettingsHandlers } from './ipc/settings.handlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'PromptVault Desktop',
    webPreferences: {
      // Путь корректен для electron-vite: dist/main -> ../preload/preload.js
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../index.html'));
  }
}

app.whenReady().then(() => {
  try {
    // 1. Инициализация БД и миграций
    initializeDatabase();
    
    // 2. Регистрация всех IPC обработчиков
    registerPromptHandlers();
    registerReferenceHandlers();
    registerVersionHandlers();
    registerImportExportHandlers();
    registerRecentHandlers();
    registerSettingsHandlers(); // 🔧 Stage 9: Настройки и темы
    
    console.log('[Main] ✅ Database + all IPC handlers ready');
  } catch (err) {
    console.error('[Main] ❌ Failed to initialize:', err);
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Корректное закрытие соединения с БД при выходе
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});