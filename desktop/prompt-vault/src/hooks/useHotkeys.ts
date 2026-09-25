// src/hooks/useHotkeys.ts
import { useEffect, useRef } from 'react';

export interface HotkeyConfig {
  key: string;           // Например: 's', 'k', 'n'
  ctrl?: boolean;        // Ctrl/Cmd
  shift?: boolean;       // Shift
  alt?: boolean;         // Alt
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;     // Можно отключить хоткей
  // Не срабатывать, если фокус в input/textarea (кроме Ctrl+S, Ctrl+Z и т.п.)
  ignoreInInputs?: boolean;
}

/**
 * Универсальный хук для управления горячими клавишами.
 * Автоматически учитывает Cmd на macOS.
 * Работает независимо от раскладки клавиатуры (проверяет e.code для латинских букв).
 */
export function useHotkeys(configs: HotkeyConfig[]): void {
  const configsRef = useRef(configs);
  configsRef.current = configs;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Проверяем, находимся ли мы в input/textarea
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const config of configsRef.current) {
        if (config.enabled === false) continue;

        const ctrlMatch = config.ctrl ? modKey : !modKey;
        const shiftMatch = config.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = config.alt ? e.altKey : !e.altKey;

        // 🔧 Проверка и по символу (e.key), и по физическому коду клавиши (e.code).
        // Например, для 'k' проверит и e.key === 'k', и e.code === 'KeyK' (работает на русской 'л').
        const isLetter = config.key.length === 1 && /^[a-z]$/i.test(config.key);
        const codeMatch = isLetter ? e.code === `Key${config.key.toUpperCase()}` : false;
        const keyMatch = e.key.toLowerCase() === config.key.toLowerCase();

        const match = keyMatch || codeMatch;

        // Пропускаем, если в input и не разрешено там срабатывать
        if (isInInput && config.ignoreInInputs !== false) {
          // Исключение: Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X всегда работают
          const alwaysWorkInInput =
            config.ctrl && ['s', 'z', 'y', 'a', 'c', 'v', 'x'].includes(config.key.toLowerCase());
          if (!alwaysWorkInInput) continue;
        }

        if (ctrlMatch && shiftMatch && altMatch && match) {
          e.preventDefault();
          e.stopPropagation();
          config.handler(e);
          return; // Обрабатываем только первый совпавший хоткей
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}