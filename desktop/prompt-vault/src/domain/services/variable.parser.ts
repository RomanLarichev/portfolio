// src/domain/services/variable.parser.ts

export interface ParsedVariable {
  name: string;
  defaultValue?: string;
  description?: string;
  fullMatch: string; // Полный текст {{...}} для замены
}

/**
 * Парсит текст и извлекает все переменные вида {{var}}, {{var:default}}, {{var:description}}
 */
export function parseVariables(content: string): ParsedVariable[] {
  const regex = /\{\{([^}:]+)(?::([^}]+))?\}\}/g;
  const variables: ParsedVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const name = match[1].trim();
    const valueOrDesc = match[2]?.trim();

    // Пропускаем дубликаты
    if (seen.has(name)) continue;
    seen.add(name);

    // Определяем, является ли valueOrDesc дефолтом или описанием
    // Если начинается с "desc:" — это описание, иначе дефолт
    let defaultValue: string | undefined;
    let description: string | undefined;

    if (valueOrDesc) {
      if (valueOrDesc.startsWith('desc:')) {
        description = valueOrDesc.slice(5).trim();
      } else {
        defaultValue = valueOrDesc;
      }
    }

    variables.push({
      name,
      defaultValue,
      description,
      fullMatch,
    });
  }

  return variables;
}

/**
 * Подставляет значения переменных в текст
 */
export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{([^}:]+)(?::([^}]+))?\}\}/g, (match, name) => {
    const trimmedName = name.trim();
    return values[trimmedName] ?? match; // Если значения нет, оставляем как было
  });
}

/**
 * Проверяет, есть ли в тексте хотя бы одна переменная
 */
export function hasVariables(content: string): boolean {
  return /\{\{[^}]+\}\}/.test(content);
}