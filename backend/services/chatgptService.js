const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let recentFeedbacks = [];
const MAX_FEEDBACKS = 10;

async function getVerdict(application) {
  const recentFeedbackPrompt = recentFeedbacks.map(f => 
    `Заявка: ${JSON.stringify(f.application)}
    Вердикт ментора: ${f.mentorVerdict}
    Объяснение ментора: ${f.mentorExplanation}`
  ).join('\n\n');

  const prompt = `Вы - эксперт по оценке заявок для nFactorial Incubator. Ваша задача - оценить следующую заявку и определить, подходит ли кандидат для программы.

Основные критерии оценки (в порядке приоритета):

    Желание изменить направление на IT и наличие базовых знаний в программировании.
        Достаточным считается: Прохождение курсов по программированию с получением сертификатов (например, Udemy, Coursera), знание HTML, CSS, JavaScript и хотя бы одного языка бэкенда (например, Python, Java, Node.js).
        Дополнительные баллы: Участие в оффлайн занятиях или стажировках, таких как курсы от крупных компаний (например, Samsung), стажировки в IT-отделах (даже если стажировка не связана напрямую с программированием).

    Подробное описание достижений в программировании.
        Примеры сильного описания: Участие в хакатонах или гейм-джемах с подробным описанием проектов, создание и запуск собственных стартапов, разработка сложных приложений с использованием фреймворков (например, React, Angular, Django), участие в open-source проектах.
        Примеры недостаточного описания: Участие в олимпиадах без указания конкретных достижений или проектов, общие фразы о работе над проектами без подробностей.

    Проявление ответственности и дисциплинированности.
        Оценивается по: Регулярное занятие саморазвитием (социальным, техническим, спортивным), наличие конкретных примеров и рекомендаций.
        Примеры: Ведение технического блога, участие в волонтерских проектах, регулярные занятия спортом с достижениями, организация мероприятий (например, турниров).

    Возможность присутствовать в Алматы в заданное время.
        Это обязательное требование. Если кандидат не может присутствовать, сразу отклоните заявку.

    Наличие ссылки на GitHub (желательно, но не обязательно).
        При отсутствии ссылки, оцените другие показатели технических навыков. Наличие активного и наполненного GitHub профиля является плюсом.

Учитывайте следующие недавние решения менторов:
${recentFeedbackPrompt}
Используйте эти решения как ориентир для поддержания последовательности в оценках.

На основе предоставленных данных заявки, определите один из трёх вердиктов:

    "Проходит" - если кандидат явно подходит для программы.
    "Не проходит" - если кандидат явно не подходит для программы и заполнил многие поля бессмысленными словами
    "Не уверен" - если требуется дополнительная проверка ментором. Используйте этот вердикт только в исключительных случаях, когда информации действительно недостаточно и невозможно сделать обоснованное решение. Максимально старайтесь избегать этого вердикта.

Если вы не уверены, лучше поставить "Не проходит", чем передавать на проверку ментору. Постарайся быть уверенным в себе и в своих вердиктах.

Дайте краткое объяснение вашего решения (не более 50 слов).

Ответ предоставьте в следующем формате JSON:
{
"verdict": "Проходит/Не проходит/Не уверен",
"explanation": "Краткое объяснение решения"
}

Вот данные заявки:
${JSON.stringify(application, null, 2)}

Помните, это престижная и селективная программа. Будьте строги в своей оценке, но справедливы.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content.trim();
    const match = content.match(/\{.*\}/s);
    if (match) {
      const jsonStr = match[0];
      const result = JSON.parse(jsonStr);
      return result;
    } else {
      throw new Error('Не удалось извлечь JSON из ответа');
    }
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    return { verdict: "Ошибка", explanation: "Не удалось получить вердикт от ChatGPT" };
  }
}

function addRecentFeedback(application, mentorVerdict, mentorExplanation) {
  recentFeedbacks.push({ application, mentorVerdict, mentorExplanation });
  if (recentFeedbacks.length > MAX_FEEDBACKS) {
    recentFeedbacks.shift();
  }
}

async function adaptToMentorFeedback(application, mentorVerdict, mentorExplanation) {
  addRecentFeedback(application, mentorVerdict, mentorExplanation);
  console.log('Added new feedback to recent feedbacks');
}

module.exports = { getVerdict, adaptToMentorFeedback };