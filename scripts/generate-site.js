#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Функция для поиска README файлов
function findProjects(category) {
  const projects = [];
  const categoryPath = path.join(__dirname, '..', category);
  
  if (!fs.existsSync(categoryPath)) return projects;
  
  const items = fs.readdirSync(categoryPath, { withFileTypes: true });
  
  for (const item of items) {
    if (item.isDirectory()) {
      const projectPath = path.join(categoryPath, item.name);
      const readmePath = path.join(projectPath, 'README.md');
      
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        
        // Извлекаем описание из README
        const titleMatch = readmeContent.match(/^# (.+)$/m);
        const descriptionMatch = readmeContent.match(/## Описание\s*\n(.+?)(?:\n##|\n#|$)/s);
        
        projects.push({
          name: item.name,
          title: titleMatch ? titleMatch[1] : item.name,
          description: descriptionMatch ? descriptionMatch[1].trim() : 'Описание проекта',
          path: `${category}/${item.name}`,
          readmeUrl: `https://github.com/RomanLarichev/portfolio/tree/main/${category}/${item.name}`
        });
      }
    }
  }
  
  return projects;
}

// Генерация HTML
function generateHTML(projects) {
  let html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Портфолио RomanLarichev</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .category { margin: 40px 0; }
            .projects { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .project { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .project h3 { margin-top: 0; }
            .project-link { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007acc; color: white; text-decoration: none; border-radius: 4px; }
            .last-updated { font-size: 0.9em; color: #666; margin-top: 10px; }
        </style>
    </head>
    <body>
        <header>
            <h1>🚀 Портфолио разработчика</h1>
            <p>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</p>
        </header>
        
        <div class="category">
            <h2>🌐 Веб-проекты (${projects.web.length})</h2>
            <div class="projects">
  `;
  
  // Веб-проекты
  projects.web.forEach(project => {
    html += `
                <div class="project">
                    <h3>${project.title}</h3>
                    <p>${project.description.substring(0, 150)}...</p>
                    <a href="${project.readmeUrl}" class="project-link">Посмотреть проект →</a>
                </div>
    `;
  });
  
  html += `
            </div>
        </div>
        
        <div class="category">
            <h2>📱 Мобильные проекты (${projects.mobile.length})</h2>
            <div class="projects">
  `;
  
  // Мобильные проекты
  projects.mobile.forEach(project => {
    html += `
                <div class="project">
                    <h3>${project.title}</h3>
                    <p>${project.description.substring(0, 150)}...</p>
                    <a href="${project.readmeUrl}" class="project-link">Посмотреть проект →</a>
                </div>
    `;
  });
  
  html += `
            </div>
        </div>
        
        <div class="category">
            <h2>🛠️ Скрипты и утилиты (${projects.scripts.length})</h2>
            <div class="projects">
  `;
  
  // Скрипты
  projects.scripts.forEach(project => {
    html += `
                <div class="project">
                    <h3>${project.title}</h3>
                    <p>${project.description.substring(0, 150)}...</p>
                    <a href="${project.readmeUrl}" class="project-link">Посмотреть проект →</a>
                </div>
    `;
  });
  
  html += `
            </div>
        </div>
        
        <footer class="last-updated">
            <p>📅 Последнее обновление: ${new Date().toLocaleString('ru-RU')}</p>
            <p>🔄 Автоматически обновляется через GitHub Actions</p>
        </footer>
    </body>
    </html>
  `;
  
  return html;
}

// Основная функция
function main() {
  const projects = {
    web: findProjects('web'),
    mobile: findProjects('mobile'),
    scripts: findProjects('scripts')
  };
  
  const html = generateHTML(projects);
  const outputPath = path.join(__dirname, '..', '_site', 'index.html');
  
  // Создаём папку _site если её нет
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  
  // Записываем HTML
  fs.writeFileSync(outputPath, html);
  
  console.log(`✅ Сгенерирован сайт портфолио`);
  console.log(`📊 Статистика:`);
  console.log(`   Веб-проекты: ${projects.web.length}`);
  console.log(`   Мобильные проекты: ${projects.mobile.length}`);
  console.log(`   Скрипты: ${projects.scripts.length}`);
  console.log(`📁 Файл сохранён: ${outputPath}`);
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { findProjects, generateHTML };