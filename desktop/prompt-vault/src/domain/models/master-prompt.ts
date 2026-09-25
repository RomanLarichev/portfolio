// src/domain/models/master-prompt.ts
import { z } from 'zod';

// ===== Типы секций Master Prompt =====

export const MasterSectionTypeSchema = z.enum([
  'ROLE',
  'OBJECTIVE',
  'CONTEXT',
  'REQUIREMENTS',
  'CONSTRAINTS',
  'SCOPE',
  'OUT_OF_SCOPE',
  'IMPLEMENTATION',
  'TESTING',
  'VALIDATION',
  'ACCEPTANCE_CRITERIA',
  'EXIT_CRITERIA',
  'CUSTOM',
]);

export type MasterSectionType = z.infer<typeof MasterSectionTypeSchema>;

// ===== Секция =====

export const MasterSectionSchema = z.object({
  id: z.string().uuid(),
  type: MasterSectionTypeSchema,
  title: z.string().min(1).max(200),
  content: z.string(),
  order: z.number().int().nonnegative(),
});

export type MasterSection = z.infer<typeof MasterSectionSchema>;

// ===== Статусы =====

export const MasterPromptStatusSchema = z.enum([
  'PLANNING',
  'DEVELOPMENT',
  'TESTING',
  'COMPLETED',
]);

export type MasterPromptStatus = z.infer<typeof MasterPromptStatusSchema>;

// ===== Полные метаданные Master Prompt =====

export const MasterMetadataSchema = z.object({
  project: z.string().max(500).optional(),
  stage: z.string().max(100).optional(),        // Stage 0, Stage 1, ...
  status: z.string().max(100).optional(),       // PLANNING | DEVELOPMENT | TESTING | COMPLETED
  purpose: z.string().max(2000).optional(),
  scope: z.string().max(2000).optional(),
  outOfScope: z.string().max(2000).optional(),
  sections: z.array(MasterSectionSchema).default([]),
});

export type MasterMetadata = z.infer<typeof MasterMetadataSchema>;

// ===== Дефолтные заголовки секций =====

export const SECTION_TITLES: Record<MasterSectionType, string> = {
  ROLE: 'Роль',
  OBJECTIVE: 'Цель',
  CONTEXT: 'Контекст',
  REQUIREMENTS: 'Требования',
  CONSTRAINTS: 'Ограничения',
  SCOPE: 'В скоупе',
  OUT_OF_SCOPE: 'Вне скоупа',
  IMPLEMENTATION: 'Реализация',
  TESTING: 'Тестирование',
  VALIDATION: 'Валидация',
  ACCEPTANCE_CRITERIA: 'Критерии приёмки',
  EXIT_CRITERIA: 'Критерии завершения',
  CUSTOM: 'Своя секция',
};

// ===== Фабрики =====

export function createDefaultSections(): MasterSection[] {
  const types: MasterSectionType[] = [
    'ROLE',
    'OBJECTIVE',
    'CONTEXT',
    'REQUIREMENTS',
    'CONSTRAINTS',
    'ACCEPTANCE_CRITERIA',
    'EXIT_CRITERIA',
  ];
  return types.map((type, idx) => ({
    id: crypto.randomUUID(),
    type,
    title: SECTION_TITLES[type],
    content: '',
    order: idx,
  }));
}

export function createDefaultMasterMetadata(): MasterMetadata {
  return {
    project: '',
    stage: 'Stage 0',
    status: 'PLANNING',
    purpose: '',
    scope: '',
    outOfScope: '',
    sections: createDefaultSections(),
  };
}

// ===== Безопасный парсер JSON ↔ MasterMetadata =====

export function parseMasterMetadata(raw: string | null | undefined): MasterMetadata {
  if (!raw) return createDefaultMasterMetadata();
  try {
    const parsed = JSON.parse(raw);
    const result = MasterMetadataSchema.safeParse(parsed);
    return result.success ? result.data : createDefaultMasterMetadata();
  } catch {
    return createDefaultMasterMetadata();
  }
}

export function serializeMasterMetadata(meta: MasterMetadata): string {
  return JSON.stringify(meta);
}