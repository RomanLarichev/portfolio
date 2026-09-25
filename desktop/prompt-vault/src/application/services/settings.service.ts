// src/application/services/settings.service.ts
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { eq } from 'drizzle-orm';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  confirmBeforeDelete: boolean;
  language: 'ru' | 'en';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  autosaveEnabled: true,
  autosaveDelayMs: 2000,
  confirmBeforeDelete: true,
  language: 'ru',
};

export class SettingsService {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  get(): AppSettings {
    const row = this.db.query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, 'app_settings'),
    });

    if (!row) return DEFAULT_SETTINGS;

    try {
      const parsed = JSON.parse(row.value);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  update(patch: Partial<AppSettings>): AppSettings {
    const current = this.get();
    const updated = { ...current, ...patch };
    const now = new Date();

    const existing = this.db.query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, 'app_settings'),
    });

    if (existing) {
      this.db
        .update(schema.settings)
        .set({ value: JSON.stringify(updated), updatedAt: now })
        .where(eq(schema.settings.key, 'app_settings'))
        .run();
    } else {
      this.db
        .insert(schema.settings)
        .values({
          key: 'app_settings',
          value: JSON.stringify(updated),
          updatedAt: now,
        })
        .run();
    }

    return updated;
  }
}