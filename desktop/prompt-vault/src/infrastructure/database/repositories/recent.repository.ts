// src/infrastructure/database/repositories/recent.repository.ts
import { desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';

export interface RecentPromptEntry {
  promptId: string;
  openedAt: string;
}

export class RecentRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  list(limit: number = 10): RecentPromptEntry[] {
    const rows = this.db
      .select()
      .from(schema.recentPrompts)
      .orderBy(desc(schema.recentPrompts.openedAt))
      .limit(limit)
      .all();

    return rows.map((row) => ({
      promptId: row.promptId,
      openedAt: row.openedAt instanceof Date 
        ? row.openedAt.toISOString() 
        : new Date(row.openedAt).toISOString(),
    }));
  }

  add(promptId: string): void {
    const now = new Date();
    
    // Удаляем старую запись этого промпта (если есть), чтобы не было дублей
    this.db
      .delete(schema.recentPrompts)
      .where(eq(schema.recentPrompts.promptId, promptId))
      .run();

    // Вставляем новую запись
    this.db
      .insert(schema.recentPrompts)
      .values({ promptId, openedAt: now })
      .run();

    // Оставляем только последние 50 записей (чистим старые)
    const all = this.db
      .select({ id: schema.recentPrompts.id })
      .from(schema.recentPrompts)
      .orderBy(desc(schema.recentPrompts.openedAt))
      .all();
    
    if (all.length > 50) {
      const idsToDelete = all.slice(50).map((r) => r.id);
      if (idsToDelete.length > 0) {
        this.db
          .delete(schema.recentPrompts)
          .where(eq(schema.recentPrompts.id, idsToDelete[0])) // удаляем по одному для простоты
          .run();
      }
    }
  }

  clear(): void {
    this.db.delete(schema.recentPrompts).run();
  }
}