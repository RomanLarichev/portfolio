// src/infrastructure/database/connection.ts
import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Определяет, запущено ли приложение в portable-режиме.
 * Portable = когда приложение запущено из unpacked директории (не установлено).
 */
function isPortableMode(): boolean {
  const appPath = app.getAppPath();
  // Если путь содержит "app.asar" — это установленное приложение
  // Если путь заканчивается на "resources/app" или содержит "win-unpacked" — это portable
  return !appPath.includes('app.asar') || appPath.includes('win-unpacked') || appPath.includes('portable');
}

/**
 * Возвращает путь к базе данных:
 * - В portable-режиме: рядом с .exe файлом
 * - В установленном режиме: в AppData (стандартное поведение)
 */
export function getDatabasePath(): string {
  if (isPortableMode()) {
    // Portable: БД рядом с исполняемым файлом
    const exeDir = path.dirname(process.execPath);
    return path.join(exeDir, 'promptvault.db');
  } else {
    // Установленное приложение: БД в AppData
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'promptvault.db');
  }
}

/**
 * Возвращает путь к папке для бэкапов
 */
export function getBackupDir(): string {
  const dbDir = path.dirname(getDatabasePath());
  const backupDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

export function initializeDatabase(): BetterSQLite3Database<typeof schema> {
  if (db) return db;
  
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  
  // Создаём директорию, если её нет
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log(`[DB] Database path: ${dbPath}`);
  console.log(`[DB] Mode: ${isPortableMode() ? 'PORTABLE' : 'INSTALLED'}`);
  
  // Safety backup перед открытием
  if (fs.existsSync(dbPath)) {
    createSafetyBackup(dbPath);
  }
  
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('temp_store = MEMORY');
  
  db = drizzle(sqlite, { schema });
  applySchema(sqlite);
  
  return db;
}

function createSafetyBackup(dbPath: string): void {
  try {
    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `safety_${timestamp}.db`);
    
    const source = new Database(dbPath, { readonly: true });
    source.backup(backupPath).then(() => {
      source.close();
      pruneOldBackups(backupDir);
    }).catch((err) => {
      console.error('[DB] Safety backup failed:', err);
      source.close();
    });
  } catch (err) {
    console.error('[DB] Safety backup error:', err);
  }
}

function pruneOldBackups(backupDir: string, keepCount = 20): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => ({ name: f, path: path.join(backupDir, f) }))
      .sort((a, b) => b.name.localeCompare(a.name));
    
    for (const file of files.slice(keepCount)) {
      fs.unlinkSync(file.path);
    }
  } catch (err) {
    console.error('[DB] Backup prune error:', err);
  }
}

function applySchema(sqlite: Database.Database): void {
  const tableExists = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompts'")
    .get();
  
  if (!tableExists) {
    console.log('[DB] Таблицы не найдены. Создаем схему...');
    try {
      sqlite.exec(`
        CREATE TABLE projects (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
          created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE categories (
          id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE tags (
          id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE prompts (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL,
          description TEXT, category_id TEXT, project_id TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          is_favorite INTEGER NOT NULL DEFAULT 0, is_archived INTEGER NOT NULL DEFAULT 0,
          usage_count INTEGER NOT NULL DEFAULT 0, last_used_at INTEGER,
          master_metadata TEXT,
          created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE prompt_tags (
          prompt_id TEXT NOT NULL, tag_id TEXT NOT NULL,
          PRIMARY KEY(prompt_id, tag_id)
        );
        CREATE TABLE prompt_versions (
          id TEXT PRIMARY KEY, prompt_id TEXT NOT NULL, version_number INTEGER NOT NULL,
          content TEXT NOT NULL, change_note TEXT, created_at INTEGER NOT NULL,
          UNIQUE(prompt_id, version_number),
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
        CREATE TABLE settings (
          key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE recent_prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prompt_id TEXT NOT NULL, opened_at INTEGER NOT NULL,
          FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
        );
        CREATE INDEX prompts_title_idx ON prompts(title);
        CREATE INDEX prompts_project_idx ON prompts(project_id);
        CREATE INDEX prompts_category_idx ON prompts(category_id);
        CREATE INDEX prompts_status_idx ON prompts(status);
        CREATE INDEX prompts_updated_idx ON prompts(updated_at);
        CREATE INDEX idx_recent_prompt_id ON recent_prompts(prompt_id);
        CREATE INDEX idx_recent_opened_at ON recent_prompts(opened_at DESC);
      `);
      console.log('[DB] ✅ Схема базы данных успешно создана!');
    } catch (err) {
      console.error('[DB] ❌ Ошибка создания схемы:', err);
      throw err;
    }
    return;
  }
  
  // Миграции для существующей БД
  migratePromptsMasterMetadata(sqlite);
  migrateRecentPrompts(sqlite);
}

function migratePromptsMasterMetadata(sqlite: Database.Database): void {
  const existingRows = sqlite
    .prepare("PRAGMA table_info('prompts')")
    .all() as Array<{ name: string }>;
  const existing = new Set(existingRows.map((r) => r.name));
  
  if (existing.has('master_metadata')) return;
  
  console.log('[DB] Миграция: добавляем master_metadata в prompts...');
  try {
    sqlite.exec('ALTER TABLE prompts ADD COLUMN master_metadata TEXT');
    console.log('[DB] ✅ Добавлена колонка master_metadata');
  } catch (err) {
    console.error('[DB] ❌ Ошибка миграции prompts:', err);
    throw err;
  }
}

function migrateRecentPrompts(sqlite: Database.Database): void {
  const hasRecent = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recent_prompts'")
    .get();
  
  if (hasRecent) return;
  
  console.log('[DB] Миграция: создаём таблицу recent_prompts...');
  try {
    sqlite.exec(`
      CREATE TABLE recent_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id TEXT NOT NULL, opened_at INTEGER NOT NULL,
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_recent_prompt_id ON recent_prompts(prompt_id);
      CREATE INDEX idx_recent_opened_at ON recent_prompts(opened_at DESC);
    `);
    console.log('[DB] ✅ Добавлена таблица recent_prompts');
  } catch (err) {
    console.error('[DB] ❌ Ошибка миграции recent_prompts:', err);
    throw err;
  }
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}