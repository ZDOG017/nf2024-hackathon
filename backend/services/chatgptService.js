const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getVerdict(application) {
  const prompt = `
    Вы - эксперт по оценке заявок для nFactorial Incubator. 
    Оцените следующую заявку и определите, подходит ли кандидат для программы.
    
    Данные заявки:
    ${JSON.stringify(application, null, 2)}
    
    Пожалуйста, оцените заявку и выберите один из трех вердиктов:
    1. "Проходит" - если кандидат явно подходит для программы
    2. "Не проходит" - если кандидат явно не подходит для программы
    3. "Не уверен" - если требуется дополнительная проверка ментором
    
    Дайте краткое объяснение вашего решения.
    
    Ответ предоставьте в формате JSON:
    {
      "verdict": "Проходит/Не проходит/Не уверен",
      "explanation": "Краткое объяснение решения"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw error;
  }
}

module.exports = { getVerdict };