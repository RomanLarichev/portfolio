// src/infrastructure/database/seed.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import * as schema from './schema';
import { PromptService } from '../../application/services/prompt.service';
import { ReferenceService } from '../../application/services/reference.service';

/**
 * Seed-скрипт для наполнения БД демонстрационными данными.
 * Запуск: npm run seed
 *
 * Скрипт БЕЗОПАСЕН: он не удаляет существующие данные,
 * а только добавляет новые записи.
 */

function getDatabasePath(): string {
  // В CLI-режиме app.getPath недоступен, используем локальный путь
  const userDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' 
      ? path.join(process.env.HOME || '', 'Library', 'Application Support')
      : path.join(process.env.HOME || '', '.config'));
  const appPath = path.join(userDataPath, 'prompt-vault');
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  return path.join(appPath, 'promptvault.db');
}

function ensureSchema(sqlite: Database.Database): void {
  const exists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompts'").get();
  if (!exists) {
    sqlite.exec(`
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT, created_at INTEGER NOT NULL);
      CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
      CREATE TABLE prompts (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL,
        description TEXT, category_id TEXT, project_id TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
        is_favorite INTEGER NOT NULL DEFAULT 0, is_archived INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0, last_used_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      );
      CREATE TABLE prompt_tags (prompt_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY(prompt_id, tag_id));
      CREATE TABLE prompt_versions (
        id TEXT PRIMARY KEY, prompt_id TEXT NOT NULL, version_number INTEGER NOT NULL,
        content TEXT NOT NULL, change_note TEXT, created_at INTEGER NOT NULL,
        UNIQUE(prompt_id, version_number),
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
      );
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
    `);
    console.log('[Seed] Схема БД создана');
  }
}

async function seed(): Promise<void> {
  const dbPath = getDatabasePath();
  console.log(`[Seed] Подключение к БД: ${dbPath}`);
  
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  
  ensureSchema(sqlite);
  
  const db = drizzle(sqlite, { schema });
  const promptService = new PromptService(db);
  const refService = new ReferenceService(db);

  // === 1. Проекты ===
  console.log('[Seed] Создание проектов...');
  const projectCalculator = refService.createProject('Universal Calculator', 'Кроссплатформенный калькулятор');
  const projectOrthodox = refService.createProject('Orthodox React', 'Православный календарь на React');
  const projectPhoto = refService.createProject('Photo Editing', 'Android-приложение для обработки фото');
  const projectQA = refService.createProject('QA Framework', 'Автоматизация тестирования');

  // === 2. Категории ===
  console.log('[Seed] Создание категорий...');
  const catCoding = refService.createCategory('AI Coding', '#1677ff');
  const catQA = refService.createCategory('QA', '#52c41a');
  const catAndroid = refService.createCategory('Android', '#3ddc84');
  const catReact = refService.createCategory('React', '#61dafb');
  const catMaster = refService.createCategory('Master Prompts', '#722ed1');
  const catImages = refService.createCategory('Images', '#faad14');

  // === 3. Промпты ===
  console.log('[Seed] Создание промптов...');

  // Промпт 1: обычный с переменными [[тема]]
  promptService.create({
    title: 'Генератор README для [[тема]]',
    content: `Ты — опытный технический писатель. Создай исчерпывающий README.md для проекта [[тема]].

Структура:
1. Заголовок и краткое описание
2. Возможности (Features)
3. Установка
4. Использование с примерами кода
5. Архитектура
6. Contributing
7. Лицензия

Язык: русский. Стиль: профессиональный, но доступный.`,
    type: 'TEMPLATE',
    description: 'Универсальный шаблон README с переменной [[тема]]',
    categoryId: catCoding.id,
    projectId: projectCalculator.id,
    tagNames: ['readme', 'docs', 'template'],
  });

  // Промпт 2: Master Prompt с версиями
  const masterPrompt = promptService.create({
    title: 'Master Prompt: Android Photo Editor v1',
    content: `# MASTER PROMPT: ANDROID PHOTO EDITOR

## ROLE
Ты — senior Android-разработчик с 10-летним опытом.

## OBJECTIVE
Разработать приложение для редактирования фотографий на Kotlin.

## CONTEXT
Приложение должно работать на Android 8.0+ и поддерживать:
- Фильтры (sepia, grayscale, vintage)
- Обрезку и поворот
- Сохранение в галерею

## REQUIREMENTS
1. Архитектура MVVM + Clean Architecture
2. Dependency Injection через Hilt
3. Coroutines + Flow для асинхронности
4. Jetpack Compose для UI

## CONSTRAINTS
- Минимум сторонних библиотек
- Размер APK < 15 MB
- Время запуска < 1.5 сек

## ACCEPTANCE CRITERIA
- [ ] Все фильтры применяются в реальном времени
- [ ] Undo/Redo работает для всех операций
- [ ] Нет утечек памяти при обработке больших фото (10+ MP)`,
    type: 'MASTER_PROMPT',
    description: 'Главный мастер-промпт для Android-приложения Photo Editor',
    categoryId: catMaster.id,
    projectId: projectPhoto.id,
    tagNames: ['master', 'android', 'kotlin', 'photo', 'stage-1'],
  });

  // Создаем версии для мастер-промпта (имитируем эволюцию)
  promptService.update({
    id: masterPrompt.id,
    content: masterPrompt.content + `\n\n## EXIT CRITERIA\n- Код прошёл ревью\n- Покрытие тестами > 80%\n- Performance-тесты пройдены`,
  });
  promptService.update({
    id: masterPrompt.id,
    content: masterPrompt.content + `\n\n## VALIDATION GATES\n- Статический анализ: 0 критических ошибок\n- Memory leak detection: чисто`,
  });

  // Промпт 3: React компонент
  promptService.create({
    title: 'React: Hook для работы с localStorage',
    content: `Напиши кастомный React-хук useLocalStorage<T>, который:

1. Принимает key и initialValue
2. Возвращает [storedValue, setValue]
3. Синхронизируется между вкладками через storage event
4. Обрабатывает ошибки парсинга JSON
5. Поддерживает SSR (Next.js)

Используй TypeScript. Покажи пример использования с интерфейсом User.`,
    type: 'PROMPT',
    description: 'Хук для работы с localStorage с синхронизацией между вкладками',
    categoryId: catReact.id,
    projectId: projectOrthodox.id,
    tagNames: ['react', 'hooks', 'typescript', 'localStorage'],
  });

  // Промпт 4: QA тест-кейсы
  const qaPrompt = promptService.create({
    title: 'QA: Генератор тест-кейсов для [[]]',
    content: `Ты — QA-инженер уровня Senior. Сгенерируй полный набор тест-кейсов для функциональности [[]].

Для каждого тест-кейса укажи:
- ID (TC-001, TC-002...)
- Название
- Предусловия
- Шаги (нумерованные)
- Ожидаемый результат
- Приоритет (High/Medium/Low)
- Тип (Functional/UI/Negative/Boundary)

Обязательно включи:
- Happy path сценарии
- Граничные значения
- Негативные сценарии
- Сценарии безопасности (XSS, SQL injection если применимо)

Формат: Markdown-таблица.`,
    type: 'PROMPT',
    description: 'Генератор полных тест-кейсов с [[]] как переменной',
    categoryId: catQA.id,
    projectId: projectQA.id,
    tagNames: ['qa', 'testing', 'test-cases'],
  });

  // Помечаем QA-промпт как избранный
  promptService.toggleFavorite(qaPrompt.id);

  // Промпт 5: System Prompt для AI-ассистента
  promptService.create({
    title: 'System: Ассистент по Kotlin',
    content: `You are an expert Kotlin developer assistant specialized in:
- Modern Kotlin (1.9+) features
- Android development with Jetpack libraries
- Coroutines and Flow patterns
- Clean Architecture and SOLID principles

Rules:
1. Always provide complete, working code examples
2. Explain architectural decisions
3. Point out potential pitfalls
4. Suggest best practices and idiomatic Kotlin
5. Answer in Russian language`,
    type: 'SYSTEM_PROMPT',
    description: 'Системный промпт для AI-ассистента по Kotlin',
    categoryId: catCoding.id,
    tagNames: ['kotlin', 'system', 'android'],
  });

  // Промпт 6: Инструкция
  promptService.create({
    title: 'Инструкция: Настройка Git Hooks',
    content: `# Настройка Git Hooks для проекта

## Шаг 1: Создание директории
\`\`\`bash
mkdir -p .githooks
git config core.hooksPath .githooks
\`\`\`

## Шаг 2: pre-commit hook
Создай файл .githooks/pre-commit:
\`\`\`bash
#!/bin/sh
npm run lint
npm run test
\`\`\`

## Шаг 3: Права доступа
\`\`\`bash
chmod +x .githooks/pre-commit
\`\`\`

## Шаг 4: commit-msg hook
Проверка формата commit-сообщений по Conventional Commits.`,
    type: 'INSTRUCTION',
    description: 'Пошаговая инструкция по настройке Git Hooks',
    categoryId: catCoding.id,
    tagNames: ['git', 'devops', 'instruction'],
  });

  // Промпт 7: Снippet
  promptService.create({
    title: 'Snippet: Debounce на TypeScript',
    content: `function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Использование:
const debouncedSearch = debounce((query: string) => {
  console.log('Searching:', query);
}, 300);`,
    type: 'SNIPPET',
    description: 'Универсальная функция debounce с типизацией',
    categoryId: catCoding.id,
    tagNames: ['typescript', 'snippet', 'utils'],
  });

  // Промпт 8: Image processing
  promptService.create({
    title: 'Image: Промпт для генерации иконок',
    content: `Сгенерируй набор иконок для мобильного приложения "Калькулятор".

Требования:
- Формат: SVG
- Размер: 24x24, 48x48
- Стиль: минималистичный, линейный
- Цвета: основной #1677ff, secondary #8c8c8c

Иконки нужны:
1. Плюс
2. Минус
3. Умножение
4. Деление
5. Равно
6. Очистить (C)
7. Backspace
8. История`,
    type: 'PROMPT',
    description: 'ТЗ для дизайнера на набор иконок калькулятора',
    categoryId: catImages.id,
    projectId: projectCalculator.id,
    tagNames: ['design', 'icons', 'svg'],
  });

  // Промпт 9: Архивный (удалённый)
  const archived = promptService.create({
    title: 'Устаревший: jQuery код',
    content: `$(document).ready(function() {
  $('.button').click(function() {
    alert('Hello!');
  });
});`,
    type: 'SNIPPET',
    description: 'Старый jQuery-код, больше не используется',
    categoryId: catCoding.id,
    tagNames: ['jquery', 'legacy'],
  });
  promptService.archive(archived.id);

  // Промпт 10: Master Prompt с этапами (Stage 0-3)
  promptService.create({
    title: 'Master: React Universal Auditor (4 этапа)',
    content: `# MASTER PROMPT: UNIVERSAL AUDITOR

## STAGE 0: PLANNING
- Проанализировать требования
- Определить scope
- Составить список рисков

## STAGE 1: ARCHITECTURE
- Спроектировать структуру компонентов
- Определить state management (Zustand/Redux)
- Выбрать UI библиотеку

## STAGE 2: IMPLEMENTATION
- Реализовать core features
- Настроить CI/CD
- Написать unit-тесты

## STAGE 3: QA & RELEASE
- E2E тесты (Playwright)
- Performance audit (Lighthouse)
- Подготовка документации

## EXIT CRITERIA
- Lighthouse score > 90
- Coverage > 85%
- 0 critical bugs`,
    type: 'MASTER_PROMPT',
    description: 'Многоэтапный мастер-промпт для аудита React-приложения',
    categoryId: catMaster.id,
    projectId: projectOrthodox.id,
    tagNames: ['master', 'react', 'audit', 'stage-0', 'stage-1', 'stage-2', 'stage-3'],
  });

  // Делаем несколько промптов избранными
  promptService.toggleFavorite(masterPrompt.id);

  console.log('[Seed] ✅ База успешно наполнена!');
  console.log(`[Seed] Создано:
  - Проектов: 4
  - Категорий: 6
  - Промптов: 10 (включая 2 Master Prompt с версиями)
  - Избранных: 2
  - В архиве: 1`);
  
  sqlite.close();
}

seed().catch((err) => {
  console.error('[Seed] Ошибка:', err);
  process.exit(1);
});