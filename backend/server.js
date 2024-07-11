const { google } = require('googleapis');

// Загрузка учетных данных из файла
const credentials = require('./google-sheets-credentials.json');

// Идентификатор вашей Google таблицы
const spreadsheetId = 'YOUR_SPREADSHEET_ID';

// Создание JWT клиента
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Функция для чтения данных из таблицы
async function readApplications() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:K', // Измените диапазон в соответствии с вашей таблицей
    });
    return response.data.values;
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

// Функция для записи вердикта в таблицу
async function writeVerdict(row, verdict) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!L${row}`, // Предполагаем, что столбец L для вердиктов
      valueInputOption: 'RAW',
      resource: { values: [[verdict]] },
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

module.exports = { readApplications, writeVerdict };