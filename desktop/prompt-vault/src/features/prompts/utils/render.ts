//src/features/prompts/utils/render.ts
/**
 * Заменяет маркеры [[тема]] и [[]] на переданные значения.
 * [[]] — это алиас для [[тема]] (обратная совместимость с catalog.html).
 */
export function renderPrompt(content: string, topic: string): string {
  if (!topic) return content;
  return content
    .replace(/\[\[тема\]\]/g, topic)
    .replace(/\[\[\]\]/g, topic);
}

/**
 * Подсказка: есть ли в тексте хотя бы один маркер.
 */
export function hasVariables(content: string): boolean {
  return /\[\[тема\]\]|\[\[\]\]/.test(content);
}