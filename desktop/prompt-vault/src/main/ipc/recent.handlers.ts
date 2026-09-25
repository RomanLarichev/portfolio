// src/main/ipc/recent.handlers.ts
import { ipcMain } from 'electron';
import { getDb } from '../../infrastructure/database/connection';
import { RecentService } from '../../application/services/recent.service';
import { IPC } from '../../shared/types/ipc';
import { eq, desc, inArray } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

let service: RecentService | null = null;

function getService(): RecentService {
  if (!service) service = new RecentService(getDb());
  return service;
}

export function registerRecentHandlers(): void {
  ipcMain.handle(IPC.RECENT_LIST, () => {
    const db = getDb();
    const recent = getService().list(10);

    if (recent.length === 0) return [];

    // 🔧 ИСПРАВЛЕНО: используем обычный select вместо db.query.prompts.findFirst
    // db.query.* может не работать в текущей конфигурации Drizzle,
    // а db.select().from() работает всегда.
    const promptIds = recent.map((r) => r.promptId);

    const promptsData = db
      .select({
        id: schema.prompts.id,
        title: schema.prompts.title,
        type: schema.prompts.type,
        updatedAt: schema.prompts.updatedAt,
      })
      .from(schema.prompts)
      .where(inArray(schema.prompts.id, promptIds))
      .all();

    // Создаём карту для быстрого поиска
    const promptMap = new Map(
      promptsData.map((p) => [
        p.id,
        {
          title: p.title,
          type: p.type,
          updatedAt:
            p.updatedAt instanceof Date
              ? p.updatedAt.toISOString()
              : p.updatedAt
              ? new Date(p.updatedAt).toISOString()
              : null,
        },
      ])
    );

    // Собираем результат, фильтруя удалённые промпты
    return recent
      .map((entry) => {
        const prompt = promptMap.get(entry.promptId);
        if (!prompt) return null;
        return {
          promptId: entry.promptId,
          openedAt: entry.openedAt,
          title: prompt.title,
          type: prompt.type,
          updatedAt: prompt.updatedAt,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  });

  ipcMain.handle(IPC.RECENT_ADD, (_event, promptId: string) => {
    getService().add(promptId);
    return true;
  });

  ipcMain.handle(IPC.RECENT_CLEAR, () => {
    getService().clear();
    return true;
  });
}