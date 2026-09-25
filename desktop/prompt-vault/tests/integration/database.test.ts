// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../../src/infrastructure/database/schema';
import { randomUUID } from 'node:crypto';

describe('Integration: Database CRUD', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

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

    db = drizzle(sqlite, { schema });
  });

  afterAll(() => sqlite.close());

  it('должен создавать и читать промпт', () => {
    const id = randomUUID();
    const now = new Date();
    db.insert(schema.prompts).values({
      id, title: 'Test Prompt', content: 'Test content', type: 'PROMPT',
      createdAt: now, updatedAt: now,
    }).run();

    const result = db.select().from(schema.prompts).where(eq(schema.prompts.id, id)).get();
    expect(result).toBeDefined();
    expect(result?.title).toBe('Test Prompt');
  });

  it('должен создавать версию при обновлении (версионирование)', () => {
    const id = randomUUID();
    const now = new Date();
    db.insert(schema.prompts).values({
      id, title: 'V Test', content: 'v1', type: 'PROMPT',
      createdAt: now, updatedAt: now,
    }).run();

    db.insert(schema.promptVersions).values({
      id: randomUUID(), promptId: id, versionNumber: 1, content: 'v1', createdAt: now,
    }).run();

    const versions = db.select().from(schema.promptVersions).where(eq(schema.promptVersions.promptId, id)).all();
    expect(versions).toHaveLength(1);
    expect(versions[0].versionNumber).toBe(1);
  });

  it('должен каскадно удалять версии при удалении промпта', () => {
    const promptId = randomUUID();
    const now = new Date();
    db.insert(schema.prompts).values({
      id: promptId, title: 'X', content: 'X', type: 'PROMPT',
      createdAt: now, updatedAt: now,
    }).run();

    db.insert(schema.promptVersions).values({
      id: randomUUID(), promptId, versionNumber: 1, content: 'X', createdAt: now,
    }).run();

    db.delete(schema.prompts).where(eq(schema.prompts.id, promptId)).run();

    const versions = db.select().from(schema.promptVersions).where(eq(schema.promptVersions.promptId, promptId)).all();
    expect(versions).toHaveLength(0);
  });
});