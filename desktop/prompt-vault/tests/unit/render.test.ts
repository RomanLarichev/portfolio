import { describe, it, expect } from 'vitest';
import { renderPrompt, hasVariables } from '../../src/features/prompts/utils/render';

describe('Unit: renderPrompt', () => {
  it('заменяет [[тема]] на значение', () => {
    expect(renderPrompt('Привет, [[тема]]!', 'Kotlin')).toBe('Привет, Kotlin!');
  });

  it('заменяет [[]] на значение (обратная совместимость)', () => {
    // ИСПРАВЛЕНО: добавлена вторая пара скобок в строку 'Тема: [[]]'
    expect(renderPrompt('Тема: [[]]', 'React')).toBe('Тема: React');
  });

  it('заменяет все вхождения', () => {
    expect(renderPrompt('[[тема]] и [[]] и [[тема]]', 'X')).toBe('X и X и X');
  });

  it('не заменяет, если topic пустой', () => {
    expect(renderPrompt('[[тема]]', '')).toBe('[[тема]]');
  });

  it('hasVariables определяет наличие маркеров', () => {
    expect(hasVariables('[[тема]]')).toBe(true);
    expect(hasVariables('[[]]')).toBe(true);
    expect(hasVariables('обычный текст')).toBe(false);
  });
});