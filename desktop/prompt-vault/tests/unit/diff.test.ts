// tests/unit/diff.test.ts
import { describe, it, expect } from 'vitest';
import { computeDiff, diffStats } from '../../src/domain/services/diff.service';

describe('Unit: Diff Service', () => {
  it('должен возвращать пустой diff для одинаковых текстов', () => {
    const diff = computeDiff('hello\nworld', 'hello\nworld');
    // Исправлено: если тексты идентичны, изменений нет, длина массива = 0
    expect(diff).toHaveLength(0);
  });

  it('должен определять добавленные строки', () => {
    const diff = computeDiff('a\nb', 'a\nb\nc');
    const stats = diffStats(diff);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(0);
    expect(stats.unchanged).toBe(2);
  });

  it('должен определять удалённые строки', () => {
    const diff = computeDiff('a\nb\nc', 'a\nb');
    const stats = diffStats(diff);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(1);
    expect(stats.unchanged).toBe(2);
  });

  it('должен определять изменённые строки (как remove + add)', () => {
    const diff = computeDiff('a\nb', 'a\nc');
    const stats = diffStats(diff);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(1);
    expect(stats.unchanged).toBe(1);
  });

  it('должен работать с пустыми текстами', () => {
    const diff1 = computeDiff('', 'new');
    expect(diffStats(diff1).added).toBe(1);

    const diff2 = computeDiff('old', '');
    expect(diffStats(diff2).removed).toBe(1);

    const diff3 = computeDiff('', '');
    expect(diff3).toHaveLength(0);
  });

  it('должен корректно обрабатывать большие изменения', () => {
    const oldText = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    const newText = Array.from({ length: 100 }, (_, i) => `modified ${i}`).join('\n');
    const diff = computeDiff(oldText, newText);
    const stats = diffStats(diff);
    expect(stats.added).toBe(100);
    expect(stats.removed).toBe(100);
  });
});

  it('должен корректно обрабатывать большие изменения', () => {
    const oldText = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    const newText = Array.from({ length: 100 }, (_, i) => `modified ${i}`).join('\n');
    const diff = computeDiff(oldText, newText);
    const stats = diffStats(diff);
    expect(stats.added).toBe(100);
    expect(stats.removed).toBe(100);
  });
