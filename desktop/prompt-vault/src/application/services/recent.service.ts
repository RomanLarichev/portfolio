// src/application/services/recent.service.ts
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { RecentRepository, type RecentPromptEntry } from '../../infrastructure/database/repositories/recent.repository';

export class RecentService {
  private repo: RecentRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.repo = new RecentRepository(db);
  }

  list(limit: number = 10): RecentPromptEntry[] {
    return this.repo.list(limit);
  }

  add(promptId: string): void {
    this.repo.add(promptId);
  }

  clear(): void {
    this.repo.clear();
  }
}