// tests/unit/export.test.ts
import { describe, it, expect } from 'vitest';
import {
  promptToMarkdown,
  promptsToJson,
  markdownToPrompt,
  jsonToPrompts,
  generateFilename,
} from '../../src/domain/services/export.service';
import type { ExportedPrompt, ExportOptions } from '../../src/shared/types/ipc';

const samplePrompt: ExportedPrompt = {
  id: 'test-id',
  title: 'Test Prompt',
  content: 'Hello {{name}}!',
  type: 'PROMPT',
  description: 'A test',
  categoryName: 'Coding',
  projectName: 'MyProject',
  tags: ['tag1', 'tag2'],
  isFavorite: true,
  usageCount: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const defaultOptions: ExportOptions = {
  format: 'markdown',
  includeVersions: false,
  includeTags: true,
};

describe('Unit: Export Service', () => {
  it('promptToMarkdown генерирует валидный YAML front matter', () => {
    const md = promptToMarkdown(samplePrompt, defaultOptions);
    expect(md).toContain('---');
    expect(md).toContain('title: Test Prompt');
    expect(md).toContain('type: PROMPT');
    expect(md).toContain('Hello {{name}}!');
  });

  it('markdownToMarkdown roundtrip сохраняет данные', () => {
    const md = promptToMarkdown(samplePrompt, defaultOptions);
    const parsed = markdownToPrompt(md);
    expect(parsed).not.toBeNull();
    expect(parsed!.title).toBe('Test Prompt');
    expect(parsed!.type).toBe('PROMPT');
    expect(parsed!.content).toBe('Hello {{name}}!');
    expect(parsed!.tags).toEqual(['tag1', 'tag2']);
    expect(parsed!.categoryName).toBe('Coding');
    expect(parsed!.projectName).toBe('MyProject');
  });

  it('promptsToJson генерирует валидный JSON', () => {
    const json = promptsToJson([samplePrompt], defaultOptions);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0');
    expect(parsed.prompts).toHaveLength(1);
    expect(parsed.prompts[0].title).toBe('Test Prompt');
  });

  it('jsonToPrompts roundtrip сохраняет данные', () => {
    const json = promptsToJson([samplePrompt], defaultOptions);
    const parsed = jsonToPrompts(json);
    expect(parsed).not.toBeNull();
    expect(parsed).toHaveLength(1);
    expect(parsed![0].title).toBe('Test Prompt');
  });

  it('generateFilename создаёт безопасное имя', () => {
    const name = generateFilename('My Prompt! @#$', 'markdown', 1);
    expect(name).toMatch(/\.md$/);
    expect(name).not.toContain('!');
    expect(name).not.toContain('@');
  });

  it('markdownToPrompt возвращает null для невалидного markdown', () => {
    const result = markdownToPrompt('just plain text without front matter');
    expect(result).toBeNull();
  });

  it('jsonToPrompts возвращает null для невалидного JSON', () => {
    const result = jsonToPrompts('not a json');
    expect(result).toBeNull();
  });
});