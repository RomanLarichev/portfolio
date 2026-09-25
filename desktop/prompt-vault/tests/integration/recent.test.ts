// tests/integration/recent.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/infrastructure/database/schema';
import { RecentRepository } from '../../src/infrastructure/database/repositories/recent.repository';

describe('Integration: RecentRepository', () => {
  let sqlite: Database.Database;
  let repo: RecentRepository;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT, created_at INTEGER NOT NULL);
      CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
      CREATE TABLE prompts (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL,
        description TEXT, category_id TEXT, project_id TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
        is_favorite INTEGER NOT NULL DEFAULT 0, is_archived INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0, last_used_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        master_metadata TEXT
      );
      CREATE TABLE prompt_tags (prompt_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY(prompt_id, tag_id));
      CREATE TABLE prompt_versions (
        id TEXT PRIMARY KEY, prompt_id TEXT NOT NULL, version_number INTEGER NOT NULL,
        content TEXT NOT NULL, change_note TEXT, created_at INTEGER NOT NULL,
        UNIQUE(prompt_id, version_number),
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE recent_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id TEXT NOT NULL,
        opened_at INTEGER NOT NULL,
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
      );
    `);

    repo = new RecentRepository(db);
  });

  afterAll(() => sqlite.close());

  const createTestPrompt = (id: string) => {
    sqlite.prepare(`INSERT INTO prompts (id, title, content, type, created_at, updated_at) VALUES (?, 'Test', 'Test', 'PROMPT', 1, 1)`).run(id);
  };

  it('add() добавляет запись', () => {
    const promptId = 'test-prompt-1';
    createTestPrompt(promptId);
    repo.add(promptId);
    const list = repo.list(10);
    expect(list).toHaveLength(1);
    expect(list[0].promptId).toBe(promptId);
  });

  it('add() не создаёт дубликатов (перезаписывает)', () => {
    const promptId = 'test-prompt-2';
    createTestPrompt(promptId);
    repo.add(promptId);
    repo.add(promptId);
    repo.add(promptId);
    const list = repo.list(10);
    const count = list.filter((r) => r.promptId === promptId).length;
    expect(count).toBe(1);
  });

  it('list() возвращает последние N записей', async () => {
    // Очищаем таблицу перед тестом
    repo.clear();
    
    for (let i = 0; i < 15; i++) {
      const pid = `prompt-${i}`;
      createTestPrompt(pid);
      
      // 🔧 ИСПРАВЛЕНО: Вставляем напрямую с ЯВНЫМ, гарантированно разным timestamp
      // Каждая следующая запись на 1 секунду новее предыдущей
      const explicitTime = new Date(Date.now() + i * 1000);
      sqlite.prepare(`INSERT INTO recent_prompts (prompt_id, opened_at) VALUES (?, ?)`).run(pid, explicitTime.getTime());
    }
    
    const list = repo.list(10);
    expect(list).toHaveLength(10);
    
    // Самая свежая (prompt-14) должна быть первой
    expect(list[0].promptId).toBe('prompt-14');
    // Вторая по свежести (prompt-13) — второй
    expect(list[1].promptId).toBe('prompt-13');
    // Последняя в топ-10 (prompt-5)
    expect(list[9].promptId).toBe('prompt-5');
  });
});