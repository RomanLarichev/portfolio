// src/infrastructure/database/repositories/version.repository.ts
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import type { PromptVersionDTO } from '../../../shared/types/ipc';

function rowToVersion(row: typeof schema.promptVersions.$inferSelect): PromptVersionDTO {
  return {
    id: row.id,
    promptId: row.promptId,
    versionNumber: row.versionNumber,
    content: row.content,
    changeNote: row.changeNote,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
  };
}

export class VersionRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  listByPromptId(promptId: string): PromptVersionDTO[] {
    const rows = this.db
      .select()
      .from(schema.promptVersions)
      .where(eq(schema.promptVersions.promptId, promptId))
      .orderBy(desc(schema.promptVersions.versionNumber))
      .all();
    return rows.map(rowToVersion);
  }

  getById(id: string): PromptVersionDTO | null {
    const row = this.db
      .select()
      .from(schema.promptVersions)
      .where(eq(schema.promptVersions.id, id))
      .get();
    return row ? rowToVersion(row) : null;
  }

  getByPromptAndNumber(promptId: string, versionNumber: number): PromptVersionDTO | null {
    const row = this.db
      .select()
      .from(schema.promptVersions)
      .where(and(
        eq(schema.promptVersions.promptId, promptId),
        eq(schema.promptVersions.versionNumber, versionNumber)
      ))
      .get();
    return row ? rowToVersion(row) : null;
  }

  getLastVersionNumber(promptId: string): number {
    const row = this.db
      .select({ versionNumber: schema.promptVersions.versionNumber })
      .from(schema.promptVersions)
      .where(eq(schema.promptVersions.promptId, promptId))
      .orderBy(desc(schema.promptVersions.versionNumber))
      .limit(1)
      .get();
    return row?.versionNumber ?? 0;
  }

  create(promptId: string, content: string, changeNote?: string): PromptVersionDTO {
    const now = new Date();
    const id = randomUUID();
    const versionNumber = this.getLastVersionNumber(promptId) + 1;

    this.db.insert(schema.promptVersions).values({
      id,
      promptId,
      versionNumber,
      content,
      changeNote: changeNote ?? null,
      createdAt: now,
    }).run();

    return this.getById(id)!;
  }
}