// tests/integration/version.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/infrastructure/database/schema';
import { PromptService } from '../../src/application/services/prompt.service';
import { VersionService } from '../../src/application/services/version.service';

describe('Integration: Versioning & Duplicate', () => {
  let sqlite: Database.Database;
  let promptService: PromptService;
  let versionService: VersionService;

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

    promptService = new PromptService(db);
    versionService = new VersionService(db);
  });

  afterAll(() => sqlite.close());

  it('duplicate создаёт копию с новым ID и v1', () => {
    const original = promptService.create({ title: 'Original', content: 'v1 content', type: 'PROMPT', tagNames: ['tag1', 'tag2'] });
    expect(original.tags).toHaveLength(2);

    promptService.update({ id: original.id, content: 'v2 content' });
    promptService.update({ id: original.id, content: 'v3 content' });

    const copy = promptService.duplicate(original.id);
    expect(copy.id).not.toBe(original.id);
    expect(copy.title).toBe('Original (copy)');
    expect(copy.content).toBe('v3 content');
    expect(copy.isFavorite).toBe(false);

    const copyVersions = versionService.listByPromptId(copy.id);
    expect(copyVersions).toHaveLength(1);
    expect(copyVersions[0].versionNumber).toBe(1);

    const originalVersions = versionService.listByPromptId(original.id);
    expect(originalVersions).toHaveLength(3);
    expect(copy.tags).toHaveLength(2);
  });

  it('restoreVersion восстанавливает старую версию и создаёт новую', () => {
    const prompt = promptService.create({ title: 'Restore Test', content: 'v1', type: 'PROMPT' });
    promptService.update({ id: prompt.id, content: 'v2' });
    promptService.update({ id: prompt.id, content: 'v3' });

    const versions = versionService.listByPromptId(prompt.id);
    expect(versions).toHaveLength(3);
    const v1 = versions.find(v => v.versionNumber === 1)!;

    const restored = promptService.restoreVersion(prompt.id, v1.id);
    expect(restored.content).toBe('v1');

    const newVersions = versionService.listByPromptId(prompt.id);
    expect(newVersions).toHaveLength(4);
    expect(newVersions[0].versionNumber).toBe(4);
    expect(newVersions[0].changeNote).toContain('Restored from v1');
  });

  it('diff показывает изменения между версиями', () => {
    const prompt = promptService.create({ title: 'Diff Test', content: 'line1\nline2\nline3', type: 'PROMPT' });
    promptService.update({ id: prompt.id, content: 'line1\nmodified\nline3\nline4' });

    const versions = versionService.listByPromptId(prompt.id);
    const v1 = versions.find(v => v.versionNumber === 1)!;
    const v2 = versions.find(v => v.versionNumber === 2)!;

    const result = versionService.diff(v1.id, v2.id);
    expect(result.oldVersion.id).toBe(v1.id);
    expect(result.newVersion.id).toBe(v2.id);
    expect(result.stats.added).toBeGreaterThan(0);
    expect(result.stats.removed).toBeGreaterThan(0);
  });

  it('restoreVersion отклоняет чужую версию', () => {
    const p1 = promptService.create({ title: 'P1', content: 'c1', type: 'PROMPT' });
    const p2 = promptService.create({ title: 'P2', content: 'c2', type: 'PROMPT' });
    const p2Versions = versionService.listByPromptId(p2.id);
    const p2v1 = p2Versions[0];

    expect(() => promptService.restoreVersion(p1.id, p2v1.id)).toThrow('does not belong');
  });
});