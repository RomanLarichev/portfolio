// src/domain/models/prompt.ts
import { z } from 'zod';

export const PromptTypeSchema = z.enum([
  'PROMPT', 'MASTER_PROMPT', 'SYSTEM_PROMPT', 'TEMPLATE', 'INSTRUCTION', 'SNIPPET'
]);

export const PromptStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

export const PromptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Название обязательно').max(500),
  content: z.string().min(1, 'Содержимое обязательно'),
  type: PromptTypeSchema,
  description: z.string().max(2000).nullable(),
  categoryId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  status: PromptStatusSchema,
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  usageCount: z.number().int().nonnegative(),
  lastUsedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Prompt = z.infer<typeof PromptSchema>;

export const CreatePromptInputSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(500),
  content: z.string().min(1, 'Содержимое обязательно'),
  type: PromptTypeSchema,
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  tagNames: z.array(z.string()).optional(), // 🔧 ДОБАВЛЕНО: чтобы теги не отбрасывались
});

export type CreatePromptInput = z.infer<typeof CreatePromptInputSchema>;

export const UpdatePromptInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  type: PromptTypeSchema.optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  tagNames: z.array(z.string()).optional(), // 🔧 ДОБАВЛЕНО: чтобы теги не отбрасывались
}).refine(
  (data) => 
    data.title !== undefined || 
    data.content !== undefined || 
    data.type !== undefined || 
    data.description !== undefined || 
    data.categoryId !== undefined || 
    data.projectId !== undefined || 
    data.tagNames !== undefined,
  { message: 'Нужно изменить хотя бы одно поле' }
);

export type UpdatePromptInput = z.infer<typeof UpdatePromptInputSchema>;