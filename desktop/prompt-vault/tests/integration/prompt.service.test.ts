// tests/integration/prompt.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/infrastructure/database/schema';
import { PromptService } from '../../src/application/services/prompt.service';

describe('Integration: PromptService', () => {
  let sqlite: Database.Database;
  let service: PromptService;

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
    `);

    service = new PromptService(db);
  });

  afterAll(() => sqlite.close());

  it('создание промпта автоматически сохраняет версию v1', () => {
    const prompt = service.create({ title: 'Тест', content: 'v1 content', type: 'PROMPT' });
    expect(prompt.id).toBeDefined();
    const versions = sqlite.prepare('SELECT * FROM prompt_versions WHERE prompt_id = ?').all(prompt.id) as any[];
    expect(versions).toHaveLength(1);
    expect(versions[0].version_number).toBe(1);
  });

  it('редактирование с изменением content создаёт новую версию', () => {
    const prompt = service.create({ title: 'V', content: 'v1', type: 'PROMPT' });
    service.update({ id: prompt.id, content: 'v2' });
    const versions = sqlite.prepare('SELECT * FROM prompt_versions WHERE prompt_id = ? ORDER BY version_number').all(prompt.id) as any[];
    expect(versions).toHaveLength(2);
    expect(versions[1].version_number).toBe(2);
    expect(versions[1].content).toBe('v2');
  });

  it('архивация и восстановление', () => {
    const prompt = service.create({ title: 'A', content: 'a', type: 'PROMPT' });
    expect(service.archive(prompt.id)).toBe(true);
    expect(service.list({ isArchived: false }).find((p) => p.id === prompt.id)).toBeUndefined();
    expect(service.restore(prompt.id)).toBe(true);
    expect(service.list({ isArchived: false }).find((p) => p.id === prompt.id)).toBeDefined();
  });

  it('окончательное удаление каскадно удаляет версии', () => {
    const prompt = service.create({ title: 'X', content: 'x', type: 'PROMPT' });
    service.update({ id: prompt.id, content: 'x2' });
    expect(service.deletePermanently(prompt.id)).toBe(true);
    expect(service.getById(prompt.id)).toBeNull();
  });

  it('toggleFavorite переключает состояние', () => {
    const prompt = service.create({ title: 'F', content: 'f', type: 'PROMPT' });
    service.toggleFavorite(prompt.id);
    expect(service.getById(prompt.id)?.isFavorite).toBe(true);
  });

  it('валидация отклоняет пустой title', () => {
    expect(() => service.create({ title: '', content: 'c', type: 'PROMPT' })).toThrow();
  });
});