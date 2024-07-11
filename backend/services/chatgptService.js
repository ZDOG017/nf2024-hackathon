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

  const prompt = `Вы - эксперт по оценке заявок для nFactorial Incubator
Оцените следующую заявку и определите, подходит ли кандидат для программы.
Учитывайте следующие недавние решения менторов:
${recentFeedbackPrompt}
Пожалуйста, будьте очень строгими в оценке кандидатов, так как это престижная и селективная программа, подобная Гарварду.

Кандидаты, которые имеют наибольший приоритет(Сверху вниз):
1. Люди, которые хотят изменить направление на IT и имеют какую-либо базу и знания в программировании.
2. Люди, которые уже сильны в программировании и подробно описали свои достижения.
3. Люди, которые проявляют ответственность и дисциплинированность как в личной, так и в академической жизни.
4. Люди, которые могут находиться в Алматы в заданное время (если не могут, сразу отклоните их).
5. Люди, у которых есть ссылка на GitHub (если ее нет, но достижения в сфере IT сильные, это приемлемо).

Основные критерии оценки:
- Желание изменить направление на IT и наличие базовых знаний в программировании.
- Подробное описание достижений в программировании.
- Проявление ответственности и дисциплинированности.
- Возможность присутствовать в Алматы в заданное время.
- Наличие ссылки на GitHub (желательно, но не обязательно).

Мы ищем людей, которые могут показать себя с лучшей стороны и создать свое личное приложение в краткие сроки. Они должны быть гибкими, быстро обучаемыми и не бояться трудностей. Эти качества должны быть очевидны из их заявки.

На основе предоставленных данных заявки, определите один из трех вердиктов:
1. "Проходит" - если кандидат явно подходит для программы.
2. "Не проходит" - если кандидат явно не подходит для программы.
3. "Не уверен" - если требуется дополнительная проверка ментором.

Дайте краткое объяснение вашего решения.
Ответ предоставьте строго в следующем формате JSON, без дополнительных символов или форматирования:
{
    "verdict": "Проходит/Не проходит/Не уверен",
    "explanation": "Краткое объяснение решения"
}

Вот данные заявки:
${JSON.stringify(application, null, 2)}`;

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