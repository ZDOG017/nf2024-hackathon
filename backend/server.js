const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { readApplications, writeVerdict,testConnection } = require('./services/googleSheetsService');
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
    const result = await getVerdict(application);
    await writeVerdict(row, result.verdict);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate application' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});