import { desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import type { ProjectDTO } from '../../../shared/types/ipc';

export class ProjectRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  list(): ProjectDTO[] {
    return this.db.select().from(schema.projects).orderBy(desc(schema.projects.updatedAt)).all() as ProjectDTO[];
  }

  create(name: string, description?: string): ProjectDTO {
    const now = new Date();
    const id = randomUUID();
    this.db.insert(schema.projects).values({ id, name, description: description || null, createdAt: now, updatedAt: now }).run();
    return this.db.select().from(schema.projects).where((p) => p.id === id).get() as ProjectDTO;
  }
}