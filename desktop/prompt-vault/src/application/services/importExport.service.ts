// src/application/services/importExport.service.ts
import { randomUUID } from 'node:crypto';
import { dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../infrastructure/database/schema';
import { PromptRepository } from '../../infrastructure/database/repositories/prompt.repository';
import { VersionRepository } from '../../infrastructure/database/repositories/version.repository';
import { TagRepository } from '../../infrastructure/database/repositories/tag.repository';
import { ProjectRepository } from '../../infrastructure/database/repositories/project.repository';
import { CategoryRepository } from '../../infrastructure/database/repositories/category.repository';
import {
  promptToMarkdown,
  promptsToJson,
  generateFilename,
  markdownToPrompt,
  jsonToPrompts,
} from '../../domain/services/export.service';
import type {
  ExportOptions,
  ExportResult,
  ExportedPrompt,
  ImportPreviewResult,
  ImportCommitResult,
  ExportFormat,
} from '../../shared/types/ipc';

export class ImportExportService {
  private promptRepo: PromptRepository;
  private versionRepo: VersionRepository;
  private tagRepo: TagRepository;
  private projectRepo: ProjectRepository;
  private categoryRepo: CategoryRepository;

  constructor(private db: BetterSQLite3Database<typeof schema>) {
    this.promptRepo = new PromptRepository(db);
    this.versionRepo = new VersionRepository(db);
    this.tagRepo = new TagRepository(db);
    this.projectRepo = new ProjectRepository(db);
    this.categoryRepo = new CategoryRepository(db);
  }

  /**
   * Собирает полный ExportedPrompt по ID (с версиями, тегами, проектом, категорией).
   */
  private collectPrompt(promptId: string, options: ExportOptions): ExportedPrompt {
    const prompt = this.promptRepo.getById(promptId);
    if (!prompt) throw new Error(`Prompt not found: ${promptId}`);

    const result: ExportedPrompt = {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      type: prompt.type,
      description: prompt.description,
      categoryName: prompt.category?.name ?? null,
      projectName: prompt.project?.name ?? null,
      tags: prompt.tags.map((t) => t.name),
      isFavorite: prompt.isFavorite,
      usageCount: prompt.usageCount,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };

    if (options.includeVersions) {
      result.versions = this.versionRepo.listByPromptId(promptId);
    }

    return result;
  }

  /**
   * Экспорт одного промпта с диалогом сохранения файла.
   */
  async exportSingle(promptId: string, options: ExportOptions): Promise<ExportResult | null> {
    const prompt = this.collectPrompt(promptId, options);
    const content = options.format === 'markdown'
      ? promptToMarkdown(prompt, options)
      : promptsToJson([prompt], options);

    const defaultName = generateFilename(prompt.title, options.format, 1);

    const result = await dialog.showSaveDialog({
      title: 'Экспорт промпта',
      defaultPath: defaultName,
      filters: options.format === 'markdown'
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'JSON', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) return null;

    fs.writeFileSync(result.filePath, content, 'utf-8');

    return {
      filename: path.basename(result.filePath),
      content,
      count: 1,
      format: options.format,
    };
  }

  /**
   * Экспорт нескольких промптов.
   * Markdown: каждый в отдельный файл в выбранной папке.
   * JSON: все в один файл.
   */
  async exportMultiple(promptIds: string[], options: ExportOptions): Promise<ExportResult | null> {
    const prompts = promptIds.map((id) => this.collectPrompt(id, options));

    if (options.format === 'json') {
      const content = promptsToJson(prompts, options);
      const defaultName = generateFilename('library', 'json', prompts.length);

      const result = await dialog.showSaveDialog({
        title: 'Экспорт библиотеки (JSON)',
        defaultPath: defaultName,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) return null;
      fs.writeFileSync(result.filePath, content, 'utf-8');

      return {
        filename: path.basename(result.filePath),
        content,
        count: prompts.length,
        format: 'json',
      };
    }

    // Markdown: каждый в отдельный файл
    const dirResult = await dialog.showOpenDialog({
      title: 'Выберите папку для экспорта Markdown',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (dirResult.canceled || dirResult.filePaths.length === 0) return null;
    const dir = dirResult.filePaths[0];

    for (const prompt of prompts) {
      const filename = generateFilename(prompt.title, 'markdown', 1);
      const content = promptToMarkdown(prompt, options);
      fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
    }

    return {
      filename: dir,
      content: '',
      count: prompts.length,
      format: 'markdown',
    };
  }

  /**
   * Экспорт всей библиотеки.
   */
  async exportAll(options: ExportOptions): Promise<ExportResult | null> {
    const allPrompts = this.promptRepo.list({ isArchived: false });
    const ids = allPrompts.map((p) => p.id);
    return this.exportMultiple(ids, options);
  }

  /**
   * Preview импорта: парсит файл и возвращает список того, что будет импортировано.
   * НЕ вносит изменений в БД.
   */
  async importPreview(filePath: string): Promise<ImportPreviewResult> {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    let items: ImportPreviewResult['items'] = [];
    const errors: string[] = [];
    let format: ExportFormat = 'markdown';

    if (ext === '.json') {
      format = 'json';
      const parsed = jsonToPrompts(content);
      if (!parsed) {
        errors.push('Не удалось распарсить JSON. Проверьте формат файла.');
        return { format, items, errors };
      }
      items = parsed.map((p) => ({
        title: p.title,
        type: p.type,
        description: p.description,
        contentPreview: p.content.slice(0, 200),
        tags: p.tags,
        categoryName: p.categoryName,
        projectName: p.projectName,
        versionsCount: p.versions?.length ?? 0,
        willCreateNew: true,
      }));
    } else if (ext === '.md') {
      format = 'markdown';
      const parsed = markdownToPrompt(content);
      if (!parsed) {
        errors.push('Не удалось распарсить Markdown. Проверьте front matter (title, type).');
        return { format, items, errors };
      }
      items = [{
        title: parsed.title,
        type: parsed.type,
        description: parsed.description,
        contentPreview: parsed.content.slice(0, 200),
        tags: parsed.tags,
        categoryName: parsed.categoryName,
        projectName: parsed.projectName,
        versionsCount: parsed.versions?.length ?? 0,
        willCreateNew: true,
      }];
    } else {
      errors.push(`Неподдерживаемый формат файла: ${ext}`);
    }

    return { format, items, errors };
  }

  /**
   * Commit импорта: реально создаёт промпты в БД.
   * DATA SAFETY: всегда создаёт новые ID, никогда не перезаписывает.
   */
  async importCommit(filePath: string): Promise<ImportCommitResult> {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    let promptsToImport: ExportedPrompt[] = [];
    const errors: string[] = [];
    const newIds: string[] = [];

    if (ext === '.json') {
      const parsed = jsonToPrompts(content);
      if (!parsed) {
        return { imported: 0, skipped: 0, errors: ['Invalid JSON'], newIds: [] };
      }
      promptsToImport = parsed;
    } else if (ext === '.md') {
      const parsed = markdownToPrompt(content);
      if (!parsed) {
        return { imported: 0, skipped: 0, errors: ['Invalid Markdown'], newIds: [] };
      }
      promptsToImport = [parsed];
    } else {
      return { imported: 0, skipped: 0, errors: ['Unsupported format'], newIds: [] };
    }

    // Получаем или создаём категории и проекты по именам
    const categoryMap = new Map<string, string>();
    const projectMap = new Map<string, string>();
    
    for (const cat of this.categoryRepo.list()) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }
    for (const proj of this.projectRepo.list()) {
      projectMap.set(proj.name.toLowerCase(), proj.id);
    }

    let imported = 0;
    let skipped = 0;

    for (const p of promptsToImport) {
      try {
        // Находим или создаём категорию
        let categoryId: string | null = null;
        if (p.categoryName) {
          const key = p.categoryName.toLowerCase();
          if (categoryMap.has(key)) {
            categoryId = categoryMap.get(key)!;
          } else {
            const newCat = this.categoryRepo.create(p.categoryName);
            categoryId = newCat.id;
            categoryMap.set(key, newCat.id);
          }
        }

        // Находим или создаём проект
        let projectId: string | null = null;
        if (p.projectName) {
          const key = p.projectName.toLowerCase();
          if (projectMap.has(key)) {
            projectId = projectMap.get(key)!;
          } else {
            const newProj = this.projectRepo.create(p.projectName);
            projectId = newProj.id;
            projectMap.set(key, newProj.id);
          }
        }

        // Создаём промпт
        const newId = randomUUID();
        const now = new Date();

        this.db.transaction(() => {
          this.db.insert(schema.prompts).values({
            id: newId,
            title: p.title,
            content: p.content,
            type: p.type,
            description: p.description,
            categoryId,
            projectId,
            status: 'ACTIVE',
            isFavorite: p.isFavorite,
            isArchived: false,
            usageCount: p.usageCount,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now,
          }).run();

          // Теги
          if (p.tags.length > 0) {
            this.tagRepo.syncTagsForPrompt(newId, p.tags);
          }

          // Версия v1 (обязательно)
          this.db.insert(schema.promptVersions).values({
            id: randomUUID(),
            promptId: newId,
            versionNumber: 1,
            content: p.content,
            changeNote: 'Imported',
            createdAt: now,
          }).run();

          // Дополнительные версии из импорта
          if (p.versions && p.versions.length > 1) {
            const sorted = [...p.versions].sort((a, b) => a.versionNumber - b.versionNumber);
            for (const v of sorted) {
              if (v.versionNumber === 1) continue; // уже добавили
              this.db.insert(schema.promptVersions).values({
                id: randomUUID(),
                promptId: newId,
                versionNumber: v.versionNumber,
                content: v.content,
                changeNote: v.changeNote || 'Imported version',
                createdAt: now,
              }).run();
            }
          }
        });

        newIds.push(newId);
        imported++;
      } catch (e: any) {
        errors.push(`Ошибка импорта "${p.title}": ${e.message}`);
        skipped++;
      }
    }

    return { imported, skipped, errors, newIds };
  }
}