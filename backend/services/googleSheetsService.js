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

async function readApplications() {
  try {
    console.log('Attempting to read from sheet:', spreadsheetId);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:M', // Расширяем диапазон, чтобы включить столбцы для вердикта и объяснения
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
}

async function writeVerdictAndExplanation(row, verdict, explanation) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `L${row}:M${row}`, // Предполагаем, что столбец L для вердиктов, а M для объяснений
      valueInputOption: 'RAW',
      resource: { values: [[verdict, explanation]] },
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

async function writeGithubLinkAndPlagiarismScore(row, githubLink, plagiarismScore) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `N${row}:O${row}`, // Предполагаем, что столбец N для ссылок на GitHub, а O для результатов проверки плагиата
      valueInputOption: 'RAW',
      resource: { values: [[githubLink, plagiarismScore]] },
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

module.exports = { readApplications, writeVerdictAndExplanation, writeGithubLinkAndPlagiarismScore };
