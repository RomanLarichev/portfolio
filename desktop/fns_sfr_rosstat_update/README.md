# ФНС / СФР / Росстат — Обновление

## Скачать / Download

**[Скачать установщик для Windows x64 / Download for Windows x64](https://github.com/RomanLarichev/portfolio/releases/tag/fns-sfr-rosstat-v0.1.0-beta.1)**

Версия: 0.1.0 Beta 1. Установщик находится в разделе Assets на странице релиза.

**Менеджер обновлений программ для подготовки и проверки отчётности**  
**Версия:** `0.1.0-beta.1` · **Платформа текущего выпуска:** Windows x64 · **Linux:** запланирована поддержка

> Независимое приложение. Не является официальным программным обеспечением ФНС России, Социального фонда России (СФР) или Росстата и не связано с этими ведомствами.

## О проекте

«ФНС / СФР / Росстат — Обновление» — настольное приложение, помогающее отслеживать версии отдельных программ, используемых при подготовке и проверке отчётности. Оно объединяет сведения об установленных программах, проверку версий на официальных страницах и планирование проверок.

## Возможности версии 0.1.0 Beta

- Обнаружение установленных программ и отображение сведений об их версиях: **ФНС Tester**, **Налогоплательщик ЮЛ**, **СФР ПО ПД**.
- Проверка доступных официальных версий для поддерживаемых источников, ручной запуск и проверки по расписанию.
- Работа в системном трее; необязательная автозагрузка вместе с Windows.
- Для **ФНС Tester** — скачивание проверенного установочного пакета и **контролируемый ручной запуск установки** в испытанном сценарии **2.295 → 2.298**.
- Открытие официального документа **`readme.doc`** для Tester («Что нового»).
- Локальное руководство пользователя.

**Важно:** возможности обнаружения и сверки версий зависят от доступности официальных сайтов и достоверности локальных сведений об установке. Вывод о версии по реестру или локальному файлу не всегда эквивалентен полной проверке программы.

## Установка

1. Скачайте установщик `FNS_SFR_Rosstat_Updater_0.1.0-beta.1_win-x64_setup_R5_1.exe` из этой папки (если он опубликован здесь).
2. Запустите установщик и следуйте указаниям мастера.
3. При необходимости выберите **«Запускать вместе с Windows»**. Автозагрузка не обязательна; её можно изменить в настройках приложения.
4. Откройте приложение через меню «Пуск» и перейдите в раздел **«Обновления»**.
5. Выберите ведомство и программу, затем нажмите **«Проверить сейчас»**.

Приложение публикуется как автономная сборка Windows x64: отдельная установка .NET Runtime не предполагается.

## Удаление

Удалите программу через **Параметры Windows → Установленные приложения** или через пункт удаления в меню «Пуск» (если он присутствует в установленной сборке). Перед удалением полностью завершите приложение через **трей → Выход**.

## Ограничения предварительной версии

- Установка обновлений подтверждена **только для Tester 2.295 → 2.298**. Приложение не является универсальным установщиком произвольных версий.
- Раздел Росстата и обновление статистических форм и шаблонов развиваются; завершённая автоматическая установка для них не заявляется.
- Автоматическое скачивание и установка всех поддерживаемых программ не реализованы.
- Поддержка Linux предусмотрена в планах, но **текущий установщик предназначен только для Windows x64**.
- Функция автозагрузки в первой бете проходит дополнительные испытания; если она работает некорректно, отключите её и запускайте программу вручную.

## Безопасность и источники

Приложение ориентируется на официальные страницы ведомств. Перед запуском установки Tester используется проверка установочного пакета; запуск мастера установки остаётся под контролем пользователя. Загружайте программу только из источника, которому доверяете, и сверяйте опубликованную контрольную сумму SHA-256, если она предоставлена.

## Статус

**Публичная предварительная версия (`Beta`)**. Ошибки и предложения по развитию можно направлять через раздел Issues репозитория, в котором опубликован проект.

---

# FNS / SFR / Rosstat — Updater

**Desktop update manager for Russian tax, social insurance, and statistical reporting tools**  
**Version:** `0.1.0-beta.1` · **Current release:** Windows x64 · **Linux:** planned

> This is an independent application. It is **not official software** of the Federal Tax Service of Russia (FNS), the Social Fund of Russia (SFR), or Rosstat, and is not affiliated with these agencies.

## Overview

FNS / SFR / Rosstat — Updater helps users keep track of selected desktop applications used to prepare and validate regulatory reports. It brings together local installation information, checks against official version sources, and scheduled update checks.

## Features in 0.1.0 Beta

- Detects installations and displays version information for **FNS Tester**, **Taxpayer Legal Entities (Налогоплательщик ЮЛ)**, and **SFR PO PD (ПО ПД)**.
- Checks available official versions where supported, with manual and scheduled checks.
- Supports the Windows system tray and optional startup with Windows.
- For **FNS Tester**, downloads a verified installer and provides a **user-controlled installation workflow** for the specifically tested **2.295 → 2.298** upgrade.
- Opens the official Tester **`readme.doc`** release notes.
- Includes a local user guide.

**Note:** Version detection depends on the official sources being reachable and on available local installation evidence. A version reported by the Windows registry or a local file is not necessarily a complete integrity verification.

## Installation

1. Download `FNS_SFR_Rosstat_Updater_0.1.0-beta.1_win-x64_setup_R5_1.exe` from this directory, if published here.
2. Run the installer and follow the setup wizard.
3. Optionally enable **Start with Windows**; it is not required and can be changed in the application settings.
4. Open the application from the Windows Start menu and select **Обновления (Updates)**.
5. Choose an agency and application, then select **Проверить сейчас (Check now)**.

The Windows x64 package is self-contained and is not intended to require a separate .NET Runtime installation.

## Uninstallation

Use **Windows Settings → Installed apps** or the Start menu uninstall shortcut (if present). Before uninstalling, fully exit the application via **system tray → Exit**.

## Beta limitations

- The installer workflow has been validated **only for Tester 2.295 → 2.298**; arbitrary-version upgrades are not supported.
- Rosstat-related functionality and statistical form/template updates are under development.
- Fully automated download and installation across supported applications is not provided.
- Linux support is planned; **the current installer runs on Windows x64 only**.
- The Windows autostart workflow is undergoing additional validation. If it behaves unexpectedly, disable it and start the app manually.

## Security and official sources

The application uses official agency webpages as version sources. The Tester workflow verifies the downloaded installation package and requires user interaction with the installer. Download releases only from a trusted source and compare the SHA-256 checksum when one is published.

## Release status

**Public beta.** Please use the repository's Issues section to report problems or suggest improvements.
