// src/application/services/prompt.service.ts
import { randomUUID } from 'node:crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { PromptRepository } from '../../infrastructure/database/repositories/prompt.repository';
import { VersionRepository } from '../../infrastructure/database/repositories/version.repository';
import { TagRepository } from '../../infrastructure/database/repositories/tag.repository';
import {
  CreatePromptInputSchema,
  UpdatePromptInputSchema,
  type PromptDTO,
  type SearchOptions,
} from '../../domain/models/prompt';

export class PromptService {
  private repo: PromptRepository;
  private versionRepo: VersionRepository;
  private tagRepo: TagRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.repo = new PromptRepository(db);
    this.versionRepo = new VersionRepository(db);
    this.tagRepo = new TagRepository(db);
  }

  list(options: SearchOptions): PromptDTO[] {
    return this.repo.list(options);
  }

  getById(id: string): PromptDTO | null {
    return this.repo.getById(id);
  }

  create(input: unknown): PromptDTO {
    const data = CreatePromptInputSchema.parse(input);
    const now = new Date();

    return this.db.transaction(() => {
      const prompt = this.repo.create({
        title: data.title,
        content: data.content,
        type: data.type,
        description: data.description,
        categoryId: data.categoryId,
        projectId: data.projectId,
      });

      if (data.tagNames && data.tagNames.length > 0) {
        this.tagRepo.syncTagsForPrompt(prompt.id, data.tagNames);
      }

      this.db.insert(schema.promptVersions).values({
        id: randomUUID(),
        promptId: prompt.id,
        versionNumber: 1,
        content: prompt.content,
        changeNote: 'Initial creation',
        createdAt: now,
      }).run();

      return this.repo.getById(prompt.id)!;
    })!;
  }

  update(input: unknown): PromptDTO {
    const data = UpdatePromptInputSchema.parse(input);
    const existing = this.repo.getById(data.id);
    if (!existing) throw new Error(`Prompt not found: ${data.id}`);

    return this.db.transaction(() => {
      const updated = this.repo.update(data.id, {
        title: data.title,
        content: data.content,
        type: data.type,
        description: data.description,
        categoryId: data.categoryId,
        projectId: data.projectId,
      });
      if (!updated) throw new Error('Update failed');

      if (data.tagNames !== undefined) {
        this.tagRepo.syncTagsForPrompt(data.id, data.tagNames ?? []);
      }

      const contentChanged = data.content !== undefined && data.content !== existing.content;
      if (contentChanged) {
        this.versionRepo.create(data.id, updated.content, 'Edited');
      }

      return this.repo.getById(data.id)!;
    })!;
  }

  archive(id: string): boolean { return this.repo.archive(id); }
  restore(id: string): boolean { return this.repo.restore(id); }
  deletePermanently(id: string): boolean { return this.repo.deletePermanently(id); }
  toggleFavorite(id: string): boolean { return this.repo.toggleFavorite(id); }
  bumpUsage(id: string): boolean { return this.repo.bumpUsage(id); }

  /**
   * Дублирование промпта: создаёт полную копию с новым ID.
   * Теги, проект и категория копируются. Версии НЕ копируются (копия начинается с v1).
   */
  duplicate(id: string): PromptDTO {
    const original = this.repo.getById(id);
    if (!original) throw new Error(`Prompt not found: ${id}`);

    return this.db.transaction(() => {
      const now = new Date();
      const newId = randomUUID();

      this.db.insert(schema.prompts).values({
        id: newId,
        title: `${original.title} (copy)`,
        content: original.content,
        type: original.type,
        description: original.description,
        categoryId: original.categoryId,
        projectId: original.projectId,
        status: 'ACTIVE',
        isFavorite: false,
        isArchived: false,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 🔧 FIX: Надежное извлечение имен тегов
      const tagNames = original.tags?.map(t => t.name) || [];
      if (tagNames.length > 0) {
        this.tagRepo.syncTagsForPrompt(newId, tagNames);
      }

      this.db.insert(schema.promptVersions).values({
        id: randomUUID(),
        promptId: newId,
        versionNumber: 1,
        content: original.content,
        changeNote: 'Duplicated from: ' + original.title,
        createdAt: now,
      }).run();

      return this.repo.getById(newId)!;
    })!;
  }

  /**
   * Восстановление старой версии:
   * - Берёт content из указанной версии
   * - Обновляет текущий prompt этим content
   * - Создаёт НОВУЮ версию (не перезаписывает старые!)
   *
   * DATA SAFETY: старые версии никогда не удаляются.
   */
  restoreVersion(promptId: string, versionId: string): PromptDTO {
    const version = this.versionRepo.getById(versionId);
    if (!version) throw new Error(`Version not found: ${versionId}`);
    if (version.promptId !== promptId) {
      throw new Error('Version does not belong to this prompt');
    }

    const existing = this.repo.getById(promptId);
    if (!existing) throw new Error(`Prompt not found: ${promptId}`);

    return this.db.transaction(() => {
      // Обновляем текущий prompt
      const updated = this.repo.update(promptId, { content: version.content });
      if (!updated) throw new Error('Restore failed');

      // Создаём новую версию с пометкой о восстановлении
      this.versionRepo.create(
        promptId,
        version.content,
        `Restored from v${version.versionNumber}`
      );

      return this.repo.getById(promptId)!;
    })!;
  }
}