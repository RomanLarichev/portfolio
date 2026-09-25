// src/application/services/version.service.ts
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { VersionRepository } from '../../infrastructure/database/repositories/version.repository';
import { computeDiff, diffStats } from '../../domain/services/diff.service';
import type { PromptVersionDTO, DiffLine } from '../../shared/types/ipc';

export interface DiffResult {
  oldVersion: PromptVersionDTO;
  newVersion: PromptVersionDTO;
  lines: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
}

export class VersionService {
  private repo: VersionRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.repo = new VersionRepository(db);
  }

  listByPromptId(promptId: string): PromptVersionDTO[] {
    return this.repo.listByPromptId(promptId);
  }

  getById(id: string): PromptVersionDTO | null {
    return this.repo.getById(id);
  }

  /**
   * Вычисляет diff между двумя версиями.
   * Если oldVersionId не указан — сравнивается с пустой строкой (показывает всё как "added").
   */
  diff(oldVersionId: string | null, newVersionId: string): DiffResult {
    const newVersion = this.repo.getById(newVersionId);
    if (!newVersion) throw new Error(`Version not found: ${newVersionId}`);

    const oldVersion = oldVersionId ? this.repo.getById(oldVersionId) : null;
    const oldContent = oldVersion?.content ?? '';
    const newContent = newVersion.content;

    const lines = computeDiff(oldContent, newContent);
    const stats = diffStats(lines);

    return {
      oldVersion: oldVersion ?? {
        id: '__empty__',
        promptId: newVersion.promptId,
        versionNumber: 0,
        content: '',
        changeNote: null,
        createdAt: new Date(0).toISOString(),
      },
      newVersion,
      lines,
      stats,
    };
  }
}