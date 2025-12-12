#!/bin/bash
set -e

echo "🔄 Начинаю синхронизацию портфолио..."
echo "📅 Дата: $(date)"

# Просто показываем структуру, так как проекты локальные
echo "📊 Структура портфолио:"
echo ""

# Показываем Python проекты
if [ -d "scripts/python" ]; then
  echo "🐍 Python проекты:"
  for project in scripts/python/*/; do
    if [ -d "$project" ]; then
      project_name=$(basename "$project")
      echo "  📁 $project_name"
    fi
  done
fi

echo ""
echo "🎉 Синхронизация завершена!"

