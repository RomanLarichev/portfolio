// src/domain/services/diff.service.ts
import type { DiffLine } from '../../shared/types/ipc';

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  // 🔧 FIX: Если тексты идентичны (включая два пустых), возвращаем пустой diff
  if (oldText === newText) return [];

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m, j = n;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'unchanged', content: oldLines[i - 1], oldLineNumber: i, newLineNumber: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'added', content: newLines[j - 1], newLineNumber: j });
      j--;
    } else if (i > 0) {
      stack.push({ type: 'removed', content: oldLines[i - 1], oldLineNumber: i });
      i--;
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

export function diffStats(diff: DiffLine[]): { added: number; removed: number; unchanged: number } {
  return diff.reduce(
    (acc, line) => {
      if (line.type === 'added') acc.added++;
      else if (line.type === 'removed') acc.removed++;
      else acc.unchanged++;
      return acc;
    },
    { added: 0, removed: 0, unchanged: 0 }
  );
}