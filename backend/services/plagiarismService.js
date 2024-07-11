const axios = require('axios');

async function checkPlagiarism(githubLink) {
  // Здесь должна быть реализация проверки плагиата
  // Для примера, мы просто возвращаем случайное значение
  // В реальном приложении вы должны использовать MOSS или другой сервис
  return Math.random() * 100;
}

module.exports = { checkPlagiarism };