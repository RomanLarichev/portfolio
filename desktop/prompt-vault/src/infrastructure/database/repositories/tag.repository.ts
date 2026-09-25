import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import type { TagDTO } from '../../../shared/types/ipc';

export class TagRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  list(): TagDTO[] {
    return this.db.select().from(schema.tags).all() as TagDTO[];
  }

  getOrCreateMany(names: string[]): TagDTO[] {
    const normalizedNames = names.map(n => n.trim().toLowerCase()).filter(n => n.length > 0);
    if (normalizedNames.length === 0) return [];

    const existing = this.db.select().from(schema.tags).where(inArray(schema.tags.name, normalizedNames)).all() as TagDTO[];
    const existingNames = new Set(existing.map(t => t.name));
    
    const toCreate = normalizedNames.filter(n => !existingNames.has(n));
    const now = new Date();
    
    if (toCreate.length > 0) {
      this.db.insert(schema.tags).values(
        toCreate.map(name => ({ id: randomUUID(), name, createdAt: now }))
      ).run();
    }

    return this.db.select().from(schema.tags).where(inArray(schema.tags.name, normalizedNames)).all() as TagDTO[];
  }

  syncTagsForPrompt(promptId: string, tagNames: string[]) {
    const tags = this.getOrCreateMany(tagNames);
    const tagIds = tags.map(t => t.id);

    // Удаляем старые связи
    this.db.delete(schema.promptTags).where(eq(schema.promptTags.promptId, promptId)).run();

    // Создаем новые
    if (tagIds.length > 0) {
      this.db.insert(schema.promptTags).values(
        tagIds.map(tagId => ({ promptId, tagId }))
      ).run();
    }
  }
}