const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { readApplications, writeVerdictAndExplanation } = require('./services/googleSheetsService');
const { getVerdict } = require('./services/chatgptService');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/applications', async (req, res) => {
  try {
    const applications = await readApplications();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.post('/evaluate', async (req, res) => {
  const { application, row } = req.body;
  try {
    const cleanedApplication = Object.fromEntries(
      Object.entries(application).filter(([_, v]) => v != null && v !== '')
    );
    const result = await getVerdict(cleanedApplication);
    if (result.verdict !== "Ошибка") {
      await writeVerdictAndExplanation(row, result.verdict, result.explanation);
    }
    res.json(result);
  } catch (error) {
    console.error('Failed to evaluate application:', error);
    res.status(500).json({ error: 'Failed to evaluate application' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});