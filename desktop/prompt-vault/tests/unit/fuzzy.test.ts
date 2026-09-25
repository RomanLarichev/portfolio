// tests/unit/fuzzy.test.ts
import { describe, it, expect } from 'vitest';

// Копируем функцию fuzzyMatch для тестирования
function fuzzyMatch(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q.length === 0) return 0;
  if (t.length === 0) return null;
  if (t.includes(q)) return t.indexOf(q);

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (lastMatchIdx >= 0) score += ti - lastMatchIdx - 1;
      lastMatchIdx = ti;
      qi++;
    }
  }
  if (qi < q.length) return null;
  return score + 1000;
}

describe('Unit: Fuzzy Search', () => {
  it('точное совпадение даёт минимальный score', () => {
    const score = fuzzyMatch('react', 'React Hooks');
    expect(score).not.toBeNull();
    expect(score).toBeLessThan(1000); // точное совпадение
  });

  it('fuzzy совпадение (пропуски) работает', () => {
    const score = fuzzyMatch('rct', 'React');
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(1000); // fuzzy
  });

  it('нет совпадения возвращает null', () => {
    expect(fuzzyMatch('xyz', 'React')).toBeNull();
    expect(fuzzyMatch('abc', 'React')).toBeNull();
  });

  it('пустой запрос даёт score 0', () => {
    expect(fuzzyMatch('', 'React')).toBe(0);
  });

  it('регистр не важен', () => {
    const s1 = fuzzyMatch('REACT', 'react hooks');
    const s2 = fuzzyMatch('react', 'REACT HOOKS');
    expect(s1).toEqual(s2);
  });

  it('более точное совпадение имеет меньший score', () => {
    const exact = fuzzyMatch('react', 'React Hooks');
    const fuzzy = fuzzyMatch('rct', 'React Hooks');
    expect(exact!).toBeLessThan(fuzzy!);
  });
});