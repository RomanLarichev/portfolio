import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Domain-схема (без зависимостей от UI и БД)
export const PromptTypeSchema = z.enum([
  'PROMPT', 'MASTER_PROMPT', 'SYSTEM_PROMPT', 'TEMPLATE', 'INSTRUCTION', 'SNIPPET'
]);

export const PromptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Название обязательно').max(500),
  content: z.string().min(1, 'Содержимое обязательно'),
  type: PromptTypeSchema,
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  isFavorite: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

describe('Domain: Prompt Validation', () => {
  const validPrompt = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Тестовый промпт',
    content: 'Содержимое промпта',
    type: 'PROMPT' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('должен принимать корректный промпт', () => {
    const result = PromptSchema.safeParse(validPrompt);
    expect(result.success).toBe(true);
  });

  it('должен отклонять промпт без названия', () => {
    const result = PromptSchema.safeParse({ ...validPrompt, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Название обязательно');
    }
  });

  it('должен отклонять неизвестный тип', () => {
    const result = PromptSchema.safeParse({ ...validPrompt, type: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('должен поддерживать все 6 типов промптов', () => {
    for (const type of PromptTypeSchema.options) {
      const result = PromptSchema.safeParse({ ...validPrompt, type });
      expect(result.success).toBe(true);
    }
  });
});