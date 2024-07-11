const { google } = require('googleapis');
const credentials = require('../google-sheets-credentials.json');
const spreadsheetId = '1S6nLBHH4ve9FWLtohCrOSwpJg41mIkENkYzVzUkhQ4g';

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

async function testConnection() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    console.log('Spreadsheet details:', response.data.properties);
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
  }
}

async function readApplications() {
  try {
    console.log('Attempting to read from sheet:', spreadsheetId);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:K', // Corrected range
    });
    console.log('Response received:', response.status);
    console.log('Data:', response.data);
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
}

// Функция для записи вердикта в таблицу
async function writeVerdict(row, verdict) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `L${row}`, // Предполагаем, что столбец L для вердиктов
      valueInputOption: 'RAW',
      resource: { values: [[verdict]] },
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

module.exports = { readApplications, writeVerdict, testConnection };
