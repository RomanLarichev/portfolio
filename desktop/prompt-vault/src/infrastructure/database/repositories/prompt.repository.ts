import { eq, and, or, like, desc, asc, inArray, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import type { PromptDTO, SearchOptions } from '../../../shared/types/ipc';

export class PromptRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  list(options: SearchOptions): PromptDTO[] {
    let query = this.db
      .select({
        prompt: schema.prompts,
        category: schema.categories,
        project: schema.projects,
      })
      .from(schema.prompts)
      .leftJoin(schema.categories, eq(schema.prompts.categoryId, schema.categories.id))
      .leftJoin(schema.projects, eq(schema.prompts.projectId, schema.projects.id));

    // 1. Базовый фильтр: архив или нет
    const conditions = [eq(schema.prompts.isArchived, options.isArchived ?? false)];

    // 2. Избранное
    if (options.isFavorite) {
      conditions.push(eq(schema.prompts.isFavorite, true));
    }

    // 3. Текстовый поиск (по title и content)
    if (options.query && options.query.trim().length > 0) {
      const q = `%${options.query.trim()}%`;
      conditions.push(
        or(
          like(schema.prompts.title, q),
          like(schema.prompts.content, q),
          like(schema.prompts.description, q)
        )!
      );
    }

    // 4. Фильтр по проекту
    if (options.projectId === 'none') {
      conditions.push(isNull(schema.prompts.projectId));
    } else if (options.projectId) {
      conditions.push(eq(schema.prompts.projectId, options.projectId));
    }

    // 5. Фильтр по категории
    if (options.categoryId === 'none') {
      conditions.push(isNull(schema.prompts.categoryId));
    } else if (options.categoryId) {
      conditions.push(eq(schema.prompts.categoryId, options.categoryId));
    }

    query = query.where(and(...conditions));

    // 6. Сортировка
    const sortField = options.sortBy === 'title' ? schema.prompts.title :
                      options.sortBy === 'usageCount' ? schema.prompts.usageCount :
                      options.sortBy === 'createdAt' ? schema.prompts.createdAt : schema.prompts.updatedAt;
    
    query = query.orderBy(options.sortOrder === 'asc' ? asc(sortField) : desc(sortField));

    const rows = query.all();

    // 7. Получаем теги для каждого промпта (оптимизировано: один запрос на все ID)
    const promptIds = rows.map(r => r.prompt.id);
    let tagsMap = new Map<string, any[]>();
    
    if (promptIds.length > 0) {
      const tagsData = this.db
        .select({ promptId: schema.promptTags.promptId, tag: schema.tags })
        .from(schema.promptTags)
        .leftJoin(schema.tags, eq(schema.promptTags.tagId, schema.tags.id))
        .where(inArray(schema.promptTags.promptId, promptIds))
        .all();
      
      tagsMap = tagsData.reduce((map, row) => {
        if (row.tag) {
          const arr = map.get(row.promptId) || [];
          arr.push(row.tag);
          map.set(row.promptId, arr);
        }
        return map;
      }, new Map<string, any[]>());
    }

    return rows.map(row => ({
      id: row.prompt.id,
      title: row.prompt.title,
      content: row.prompt.content,
      type: row.prompt.type as any,
      description: row.prompt.description,
      categoryId: row.prompt.categoryId,
      projectId: row.prompt.projectId,
      status: row.prompt.status as any,
      isFavorite: row.prompt.isFavorite,
      isArchived: row.prompt.isArchived,
      usageCount: row.prompt.usageCount,
      lastUsedAt: row.prompt.lastUsedAt,
      createdAt: row.prompt.createdAt.toISOString(),
      updatedAt: row.prompt.updatedAt.toISOString(),
      tags: tagsMap.get(row.prompt.id) || [],
      project: row.project ? { ...row.project, createdAt: row.project.createdAt.toISOString(), updatedAt: row.project.updatedAt.toISOString() } : null,
      category: row.category ? { ...row.category, createdAt: row.category.createdAt.toISOString() } : null,
    }));
  }

  getById(id: string): PromptDTO | null {
    const row = this.db
      .select({ prompt: schema.prompts, category: schema.categories, project: schema.projects })
      .from(schema.prompts)
      .leftJoin(schema.categories, eq(schema.prompts.categoryId, schema.categories.id))
      .leftJoin(schema.projects, eq(schema.prompts.projectId, schema.projects.id))
      .where(eq(schema.prompts.id, id))
      .get();

    if (!row) return null;

    const tags = this.db
      .select({ tag: schema.tags })
      .from(schema.promptTags)
      .leftJoin(schema.tags, eq(schema.promptTags.tagId, schema.tags.id))
      .where(eq(schema.promptTags.promptId, id))
      .all()
      .map(r => r.tag)
      .filter(Boolean) as any[];

    return {
      id: row.prompt.id,
      title: row.prompt.title,
      content: row.prompt.content,
      type: row.prompt.type as any,
      description: row.prompt.description,
      categoryId: row.prompt.categoryId,
      projectId: row.prompt.projectId,
      status: row.prompt.status as any,
      isFavorite: row.prompt.isFavorite,
      isArchived: row.prompt.isArchived,
      usageCount: row.prompt.usageCount,
      lastUsedAt: row.prompt.lastUsedAt,
      createdAt: row.prompt.createdAt.toISOString(),
      updatedAt: row.prompt.updatedAt.toISOString(),
      tags,
      project: row.project ? { ...row.project, createdAt: row.project.createdAt.toISOString(), updatedAt: row.project.updatedAt.toISOString() } : null,
      category: row.category ? { ...row.category, createdAt: row.category.createdAt.toISOString() } : null,
    };
  }

  create(data: { title: string; content: string; type: any; description?: string; categoryId?: string | null; projectId?: string | null }): any {
    const now = new Date();
    const id = randomUUID();
    this.db.insert(schema.prompts).values({
      id, title: data.title, content: data.content, type: data.type,
      description: data.description ?? null, categoryId: data.categoryId ?? null, projectId: data.projectId ?? null,
      status: 'ACTIVE', isFavorite: false, isArchived: false, usageCount: 0, lastUsedAt: null, createdAt: now, updatedAt: now,
    }).run();
    return this.getById(id);
  }

  update(id: string, patch: Partial<any>): any {
    const now = new Date();
    this.db.update(schema.prompts).set({ ...patch, updatedAt: now }).where(eq(schema.prompts.id, id)).run();
    return this.getById(id);
  }

  archive(id: string): boolean { return this.db.update(schema.prompts).set({ isArchived: true, updatedAt: new Date() }).where(eq(schema.prompts.id, id)).run().changes > 0; }
  restore(id: string): boolean { return this.db.update(schema.prompts).set({ isArchived: false, updatedAt: new Date() }).where(eq(schema.prompts.id, id)).run().changes > 0; }
  deletePermanently(id: string): boolean { return this.db.delete(schema.prompts).where(eq(schema.prompts.id, id)).run().changes > 0; }
  toggleFavorite(id: string): boolean {
    const current = this.getById(id);
    if (!current) return false;
    this.db.update(schema.prompts).set({ isFavorite: !current.isFavorite, updatedAt: new Date() }).where(eq(schema.prompts.id, id)).run();
    return true;
  }
  bumpUsage(id: string): boolean {
    const current = this.getById(id);
    if (!current) return false;
    const now = new Date();
    this.db.update(schema.prompts).set({ usageCount: current.usageCount + 1, lastUsedAt: now, updatedAt: now }).where(eq(schema.prompts.id, id)).run();
    return true;
  }
}