// src/domain/services/export.service.ts
import matter from 'gray-matter';
import type {
  ExportedPrompt,
  ExportFormat,
  ExportOptions,
  ExportResult,
  PromptVersionDTO,
} from '../../shared/types/ipc';

/**
 * Преобразует промпт в Markdown с YAML front matter.
 * Формат совместим с Obsidian, Notion, GitHub.
 */
export function promptToMarkdown(
  prompt: ExportedPrompt,
  options: ExportOptions
): string {
  const frontMatter: Record<string, any> = {
    title: prompt.title,
    type: prompt.type,
    description: prompt.description || '',
    isFavorite: prompt.isFavorite,
    usageCount: prompt.usageCount,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };

  if (options.includeTags !== false && prompt.tags.length > 0) {
    frontMatter.tags = prompt.tags;
  }
  if (prompt.categoryName) frontMatter.category = prompt.categoryName;
  if (prompt.projectName) frontMatter.project = prompt.projectName;

  let body = prompt.content;

  // Добавляем версии как отдельные секции
  if (options.includeVersions && prompt.versions && prompt.versions.length > 1) {
    body += '\n\n---\n\n# История версий\n\n';
    const sorted = [...prompt.versions].sort((a, b) => a.versionNumber - b.versionNumber);
    sorted.forEach((v) => {
      body += `## v${v.versionNumber} — ${new Date(v.createdAt).toLocaleString('ru-RU')}\n\n`;
      if (v.changeNote) body += `> ${v.changeNote}\n\n`;
      body += '```\n' + v.content + '\n```\n\n';
    });
  }

  const file = matter.stringify(body, frontMatter);
  return file;
}

/**
 * Преобразует массив промптов в JSON (для бэкапа).
 */
export function promptsToJson(
  prompts: ExportedPrompt[],
  options: ExportOptions
): string {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    format: 'json',
    options,
    prompts,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Генерирует безопасное имя файла.
 */
export function generateFilename(
  base: string,
  format: ExportFormat,
  count: number
): string {
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const ext = format === 'markdown' ? (count === 1 ? 'md' : 'zip-not-supported') : 'json';
  
  if (count === 1) {
    return `${safeBase}_${timestamp}.${ext}`;
  }
  return `promptvault_export_${timestamp}.${ext}`;
}

/**
 * Парсит Markdown с front matter обратно в ExportedPrompt.
 */
export function markdownToPrompt(mdContent: string): ExportedPrompt | null {
  try {
    const parsed = matter(mdContent);
    const fm = parsed.data;
    
    if (!fm.title || !fm.type) {
      return null;
    }

    // Извлекаем версии из тела, если есть
    const versions: PromptVersionDTO[] = [];
    let content = parsed.content;
    
    const versionsSectionMatch = content.match(/\n---\n\n# История версий\n\n([\s\S]*)$/);
    if (versionsSectionMatch) {
      const versionsBlock = versionsSectionMatch[1];
      const versionRegex = /## v(\d+) — ([^\n]+)\n\n(?:> ([^\n]+)\n\n)?```\n([\s\S]*?)\n```/g;
      let vMatch;
      while ((vMatch = versionRegex.exec(versionsBlock)) !== null) {
        versions.push({
          id: `imported-v${vMatch[1]}`,
          promptId: '',
          versionNumber: parseInt(vMatch[1], 10),
          content: vMatch[4],
          changeNote: vMatch[3] || null,
          createdAt: new Date(vMatch[2]).toISOString() || new Date().toISOString(),
        });
      }
      content = content.replace(versionsSectionMatch[0], '').trim();
    }

    return {
      id: '', // будет создан при импорте
      title: fm.title,
      content: content.trim(),
      type: fm.type,
      description: fm.description || null,
      categoryName: fm.category || null,
      projectName: fm.project || null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      isFavorite: Boolean(fm.isFavorite),
      usageCount: Number(fm.usageCount) || 0,
      createdAt: fm.createdAt || new Date().toISOString(),
      updatedAt: fm.updatedAt || new Date().toISOString(),
      versions: versions.length > 0 ? versions : undefined,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Парсит JSON-экспорт.
 */
export function jsonToPrompts(jsonContent: string): ExportedPrompt[] | null {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
      return null;
    }
    return parsed.prompts as ExportedPrompt[];
  } catch (e) {
    return null;
  }
}