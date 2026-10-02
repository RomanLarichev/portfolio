# Архитектура

Это публичное издание намеренно содержит небольшую вертикальную часть оригинального фреймворка.

```text
Тесты
├── UI (Selenium)
└── API (REST Assured + WireMock)
     │
     ▼
Страницы / API-клиент
     │
     ▼
Ядро
├── Конфигурация
├── Жизненный цикл драйвера (ThreadLocal)
├── Явные ожидания
└── Синтетические тестовые данные
```

## Проектные решения

- **ThreadLocal WebDriver** изолирует жизненный цикл драйвера для каждого тестового потока.
- **Page Object** выносит селекторы и UI-действия за пределы тестовых утверждений.
- **Фасад API-клиента** централизует конфигурацию REST Assured и фильтрацию Allure.
- **Локальный демонстрационный веб-сервер** устраняет зависимость от корпоративного или стороннего UI.
- **WireMock** обеспечивает детерминированные API-контракты для интеграционных тестов.
- **Конфигурация через переменные окружения/системные свойства** избегает жестко закодированных приватных эндпоинтов.

## Намеренно исключено из публичного издания

Частный фреймворк для разработки также содержит экспериментальные или расширенные модули для мобильного тестирования, обмена сообщениями, нагрузочного тестирования, наблюдаемости, тестирования доступности и сценариев, ориентированных на безопасность. Они здесь опущены, чтобы портфолио-репозиторий оставался небольшим, проверяемым и работоспособным в качестве целостной демонстрации.

# Architecture

This public edition keeps a deliberately small vertical slice of the original framework.

```text
Tests
├── UI (Selenium)
└── API (REST Assured + WireMock)
     │
     ▼
Pages / API Client
     │
     ▼
Core
├── Configuration
├── Driver lifecycle (ThreadLocal)
├── Explicit waits
└── Synthetic test data
```

## Design choices

- **ThreadLocal WebDriver** keeps driver lifecycle isolated per test thread.
- **Page Object** keeps selectors and UI actions outside test assertions.
- **API client facade** centralizes REST Assured configuration and Allure filtering.
- **Local demo web server** removes dependency on a corporate or third-party UI.
- **WireMock** provides deterministic API contracts for integration-style tests.
- **Environment/system-property configuration** avoids hard-coded private endpoints.

## Intentionally excluded from the public edition

The private development framework also contains experimental or extended modules for mobile, messaging, load testing, observability, accessibility and security-focused scenarios. They are omitted here to keep the portfolio repository small, auditable and runnable as a coherent demo.
