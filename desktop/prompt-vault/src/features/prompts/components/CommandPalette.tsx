// src/features/prompts/components/CommandPalette.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Input, Empty } from 'antd';
import {
  FileTextOutlined,
  StarFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { usePromptStore } from '../../../stores/prompt.store';
import type { PromptDTO } from '../../../shared/types/ipc';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Простой fuzzy-поиск: проверяет, что все символы запроса
 * встречаются в строке в правильном порядке (не обязательно подряд).
 * Возвращает score (меньше = лучше совпадение) или null, если нет совпадения.
 */
function fuzzyMatch(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (q.length === 0) return 0;
  if (t.length === 0) return null;

  // Точное вхождение — лучший score
  if (t.includes(q)) {
    return t.indexOf(q);
  }

  // Fuzzy: ищем символы по порядку
  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Штраф за пропуски между символами
      if (lastMatchIdx >= 0) {
        score += ti - lastMatchIdx - 1;
      }
      lastMatchIdx = ti;
      qi++;
    }
  }

  // Если не все символы нашлись — нет совпадения
  if (qi < q.length) return null;

  return score + 1000; // +1000, чтобы точные совпадения были выше
}

export const CommandPalette: React.FC<Props> = ({ open, onClose }) => {
  const { prompts, selectPrompt } = usePromptStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);

  // Фильтруем и сортируем по fuzzy score
  const results = useMemo(() => {
    if (!query.trim()) {
      // Показываем последние 10 промптов
      return prompts.slice(0, 10);
    }

    const scored: Array<{ prompt: PromptDTO; score: number }> = [];

    for (const prompt of prompts) {
      const titleScore = fuzzyMatch(query, prompt.title);
      const descScore = prompt.description ? fuzzyMatch(query, prompt.description) : null;

      const bestScore = Math.min(
        ...(titleScore !== null ? [titleScore] : [Infinity]),
        ...(descScore !== null ? [descScore + 500] : [Infinity])
      );

      if (bestScore !== Infinity) {
        scored.push({ prompt, score: bestScore });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 20).map((s) => s.prompt);
  }, [query, prompts]);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Сброс индекса при изменении результатов
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleSelect = (prompt: PromptDTO) => {
    selectPrompt(prompt.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <Input
          ref={inputRef}
          size="large"
          placeholder="🔍 Поиск промпта... (↑↓ для навигации, Enter для выбора)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          prefix={<ThunderboltOutlined style={{ color: '#1677ff' }} />}
          allowClear
        />
      </div>

      {/* 🔧 Заменили устаревший <List> на обычный map, чтобы убрать warning Ant Design */}
      <div style={{ maxHeight: 400, overflow: 'auto', padding: '0 8px 8px' }}>
        {results.length === 0 ? (
          <Empty
            description="Ничего не найдено"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 24 }}
          />
        ) : (
          results.map((prompt, idx) => (
            <div
              key={prompt.id}
              onClick={() => handleSelect(prompt)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: idx === selectedIndex ? '#e6f4ff' : 'transparent',
                border: idx === selectedIndex ? '1px solid #91caff' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  fontSize: 18,
                  color: prompt.isFavorite ? '#faad14' : '#8c8c8c',
                }}
              >
                {prompt.isFavorite ? <StarFilled /> : <FileTextOutlined />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prompt.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '0 4px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: 4,
                    }}
                  >
                    {prompt.type}
                  </span>
                  {prompt.isArchived && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '0 4px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 4,
                        color: '#999',
                      }}
                    >
                      архив
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#8c8c8c',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prompt.description || prompt.content.slice(0, 80)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          fontSize: 11,
          color: '#8c8c8c',
          display: 'flex',
          gap: 16,
        }}
      >
        <span>↑↓ навигация</span>
        <span>↵ выбрать</span>
        <span>esc закрыть</span>
      </div>
    </Modal>
  );
};