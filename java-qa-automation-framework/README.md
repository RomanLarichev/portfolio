# Java QA Automation Framework — Версия для портфолио

Компактная публичная демонстрация более крупного фреймворка для автоматизации тестирования на Java. Репозиторий демонстрирует чистый вертикальный срез для UI, API и интеграционного тестирования на основе моков, не раскрывая корпоративные среды, учетные данные или внутреннюю инфраструктуру.

## Что демонстрирует этот проект

- Java 21
- JUnit 5
- Selenium WebDriver
- REST Assured
- Паттерн Page Object
- Потокобезопасный жизненный цикл WebDriver (`ThreadLocal`)
- Явные ожидания (Explicit waits)
- Виртуализация API с помощью WireMock
- Хелперы для генерации синтетических тестовых данных
- Результаты тестов, совместимые с Allure
- CI на базе GitHub Actions
- Опциональная инфраструктура на Docker Compose

## Архитектура

```
Tests
├── UI tests
│    └── Page Objects
└── API tests
     └── API Client
          │
          ▼
Core
├── Config
├── DriverFactory
├── Waits
└── TestDataGenerator
```

Более подробное описание доступно в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Почему демо-версия является автономной

UI-тесты запускают небольшое локальное веб-приложение во время прогона тестов, а API-тесты запускают WireMock на динамическом локальном порту. Это делает портфолио-версию детерминированной и исключает зависимости от приватных тестовых сред или публичных демо-сайтов.

## Примеры тестов

**UI**

- успешная аутентификация перенаправляет на дашборд;
- невалидные учетные данные отображают сообщение об ошибке валидации.

**API**

- проверяет контракт `GET /api/users/{id}`;
- проверяет JSON-пейлоад, отправленный через `POST /api/users`;
- проверяет ожидаемые запросы через WireMock.

**Core**

- проверяет безопасную конфигурацию по умолчанию;
- проверяет генерацию уникальных синтетических пользователей.

## Локальный запуск

**Требования:**

- JDK 21
- Gradle 8+
- Chrome (для UI-тестов; используйте `-Dbrowser=firefox` для Firefox)

```bash
gradle clean test -Dheadless=true
```

Запуск UI-тестов с видимым окном браузера:

```bash
gradle test -Dheadless=false
```

Firefox:

```bash
gradle test -Dbrowser=firefox -Dheadless=true
```

Отчеты о тестировании генерируются в директории:

```
build/reports/tests/test/
build/allure-results/
```

## CI

Файл `.github/workflows/tests.yml` запускает проект на Java 21 / Gradle и загружает отчеты о тестировании в качестве артефактов рабочего процесса.

## Опциональная локальная инфраструктура

Тестам в портфолио не требуется Docker. Файл `infra/docker-compose.yml` включен только для демонстрации того, как фреймворк может быть подключен к локальной тестовой инфраструктуре:

```bash
cd infra
docker compose up -d
```

Это запускает:

- WireMock
- PostgreSQL

## Конфигурация

Публичная версия не содержит закоммиченного файла `.env`. Значения для рантайма могут быть переданы через переменные окружения или системные свойства.

**Примеры:**

```env
BROWSER=chrome
HEADLESS=true
UI_TIMEOUT_SECONDS=10
```

или:

```bash
gradle test -Dbrowser=chrome -Dheadless=true -Dui.timeout.seconds=15
```

## Структура репозитория

```
src/main/java/com/romanlarichev/qa/
├── api/
├── config/
├── data/
├── driver/
├── model/
├── pages/
├── steps/
└── wait/

src/test/java/com/romanlarichev/qa/
├── api/
├── config/
├── data/
├── support/
└── ui/
```

## Объем портфолио

Этот репозиторий намеренно сделан меньше, чем закрытый рабочий фреймворк. Более крупный проект включает дополнительные модули и эксперименты в области мобильной автоматизации, обмена сообщениями, нагрузочного тестирования, наблюдаемости (observability), тестирования доступности (accessibility) и тестирования, ориентированного на безопасность. Эти компоненты не требуются для демонстрации базовой архитектуры и намеренно исключены из публичной версии.

## Безопасность и гигиена публикации

Этот репозиторий намеренно не содержит:

- корпоративных URL-адресов или IP-адресов;
- токенов доступа или учетных данных;
- сертификатов;
- файлов `.env` с секретами;
- бинарных файлов браузеров;
- логов падений или сгенерированных артефактов Allure.

Все тестовые аккаунты и пейлоады являются синтетическими.

## Происхождение

Портфолио-версия представляет собой тщательно отобранную и очищенную реконструкцию избранных архитектурных идей из более крупного личного QA-фреймворка. Она разработана как читаемая публичная демонстрация, а не как полный дистрибутив оригинального фреймворка.

## Лицензия

MIT — см. [LICENSE](LICENSE).

# Java QA Automation Framework — Portfolio Edition

A compact public showcase of a larger Java test-automation framework. The repository demonstrates a clean vertical slice for **UI, API and mock-based integration testing** without exposing corporate environments, credentials or internal infrastructure.

## What this project demonstrates

- Java 21
- JUnit 5
- Selenium WebDriver
- REST Assured
- Page Object pattern
- Thread-safe WebDriver lifecycle (`ThreadLocal`)
- Explicit waits
- WireMock API virtualization
- Synthetic test-data helpers
- Allure-compatible test results
- GitHub Actions CI
- Optional Docker Compose infrastructure

## Architecture

```text
Tests
├── UI tests
│    └── Page Objects
└── API tests
     └── API Client
          │
          ▼
Core
├── Config
├── DriverFactory
├── Waits
└── TestDataGenerator
```

A more detailed description is available in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Why the demo is self-contained

The UI tests start a tiny local web application during the test run, and API tests start WireMock on a dynamic local port. This keeps the portfolio version deterministic and avoids dependencies on private test environments or public demo sites.

## Test examples

### UI

- successful authentication redirects to a dashboard;
- invalid credentials show a validation message.

### API

- validates a `GET /api/users/{id}` contract;
- verifies a JSON payload sent by `POST /api/users`;
- verifies expected requests through WireMock.

### Core

- validates safe default configuration;
- checks generation of unique synthetic users.

## Running locally

Requirements:

- JDK 21
- Gradle 8+
- Chrome (for UI tests; use `-Dbrowser=firefox` for Firefox)

```bash
gradle clean test -Dheadless=true
```

Run UI tests with a visible browser:

```bash
gradle test -Dheadless=false
```

Firefox:

```bash
gradle test -Dbrowser=firefox -Dheadless=true
```

Test reports are generated under:

```text
build/reports/tests/test/
build/allure-results/
```

## CI

`.github/workflows/tests.yml` runs the project on **Java 21 / Gradle** and uploads test reports as workflow artifacts.

## Optional local infrastructure

The portfolio tests do not require Docker. `infra/docker-compose.yml` is included only to demonstrate how the framework can be connected to local test infrastructure:

```bash
cd infra
docker compose up -d
```

It starts:

- WireMock
- PostgreSQL

## Configuration

The public edition contains no committed `.env` file. Runtime values can be supplied through environment variables or system properties.

Examples:

```text
BROWSER=chrome
HEADLESS=true
UI_TIMEOUT_SECONDS=10
```

or:

```bash
gradle test -Dbrowser=chrome -Dheadless=true -Dui.timeout.seconds=15
```

## Repository structure

```text
src/main/java/com/romanlarichev/qa/
├── api/
├── config/
├── data/
├── driver/
├── model/
├── pages/
├── steps/
└── wait/

src/test/java/com/romanlarichev/qa/
├── api/
├── config/
├── data/
├── support/
└── ui/
```

## Portfolio scope

This repository is intentionally smaller than the private development framework. The larger project includes additional modules and experiments around mobile automation, messaging, load testing, observability, accessibility and security-focused testing. Those components are not required to demonstrate the core architecture and are intentionally excluded from the public edition.

## Security / publishing hygiene

This repository intentionally contains:

- no corporate URLs or IP addresses;
- no access tokens or credentials;
- no certificates;
- no `.env` with secrets;
- no browser binaries;
- no crash logs or generated Allure artifacts.

All test accounts and payloads are synthetic.

## Origin

The portfolio edition is a curated, sanitized reconstruction of selected architectural ideas from a larger personal QA automation framework. It is designed as a readable public demonstration rather than a full distribution of the original framework.

## License

MIT — see [`LICENSE`](LICENSE).
