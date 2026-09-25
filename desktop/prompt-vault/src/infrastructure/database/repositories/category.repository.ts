import { desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import type { CategoryDTO } from '../../../shared/types/ipc';

export class CategoryRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  list(): CategoryDTO[] {
    return this.db.select().from(schema.categories).orderBy(desc(schema.categories.createdAt)).all() as CategoryDTO[];
  }

  create(name: string, color?: string): CategoryDTO {
    const now = new Date();
    const id = randomUUID();
    this.db.insert(schema.categories).values({ id, name, color: color || null, createdAt: now }).run();
    return this.db.select().from(schema.categories).where((c) => c.id === id).get() as CategoryDTO;
  }
}
