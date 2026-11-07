# RegistryInspector — Инспектор COM-реестра Windows

**Версия:** 0.6.0 RC1 (предварительный выпуск)  
**Платформа:** Windows 10/11 x64  
**Технологии:** C#, .NET 8, Windows Forms

[Русский](#описание) | [English](#english)

## Описание

RegistryInspector — настольное приложение для диагностики COM-компонентов, анализа регистраций Windows и проверки компонентов установленных программ.

Приложение помогает находить некорректные пути COM-серверов, анализировать связи CLSID, ProgID и TypeLib, обнаруживать исторические регистрации и формировать диагностические отчёты.

## Возможности

- Поиск и анализ библиотек DLL, OCX и исполняемых файлов EXE.
- Анализ регистраций COM, CLSID, ProgID и TypeLib.
- Диагностика 32-битных COM-компонентов в Windows x64.
- Проверка путей зарегистрированных COM-серверов.
- Создание, сохранение и загрузка профилей приложений.
- Проверка состояния COM-компонентов.
- Поиск исторических и потенциально устаревших регистраций.
- Резервное копирование связанных записей реестра.
- Предварительная проверка восстановления и обнаружение конфликтов.
- Экспорт результатов диагностики в JSON.

## Безопасность

RegistryInspector по умолчанию выполняет диагностические операции без изменения реестра.

Операции регистрации компонентов, удаления записей и восстановления требуют дополнительных разрешений и подтверждения пользователя.

**Важно:** отсутствие COM-регистрации не обязательно означает неисправность DLL или EXE.

Перед внесением изменений рекомендуется создавать резервную копию реестра и точку восстановления Windows.

## Системные требования

- Windows 10 или Windows 11 (x64).
- Права администратора для операций, изменяющих системный реестр.
- Для автономной сборки установка .NET Runtime не требуется.

## Скачать

Предварительная версия **RegistryInspector 0.6.0 RC1** будет доступна в разделе GitHub Releases.

Исходный код на данном этапе не публикуется.

## Статус проекта

**0.6.0 RC1 — Release Candidate.**

Программа находится на этапе подготовки публичного выпуска. Рекомендуется предварительное тестирование перед использованием операций, изменяющих реестр.

---

# English

## Overview

RegistryInspector is a Windows desktop application for inspecting COM registrations, diagnosing application components, and identifying potentially obsolete registry entries.

**Version:** 0.6.0 RC1  
**Platform:** Windows 10/11 x64  
**Technology:** C#, .NET 8, Windows Forms

## Features

- DLL, OCX, and EXE component discovery.
- COM registration analysis.
- CLSID, ProgID, and TypeLib inspection.
- 32-bit COM diagnostics on 64-bit Windows.
- Registered COM server path validation.
- Application profile creation and loading.
- Historical COM registration analysis.
- Registry backup and restore preflight.
- JSON diagnostic report export.

## Safety

Read-only diagnostics are preferred by default.

Registry modifications require appropriate permissions and explicit confirmation.

A missing COM registration does not necessarily indicate a defective component.

## Download

RegistryInspector 0.6.0 RC1 will be distributed through GitHub Releases.

Source code is not publicly available at this stage.

## Release Status

**0.6.0 RC1 — Release Candidate.**

This is a pre-release version intended for testing and evaluation.
