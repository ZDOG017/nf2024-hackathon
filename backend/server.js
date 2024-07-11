const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { readApplications, writeVerdictAndExplanation, writeGithubLinkAndPlagiarismScore } = require('./services/googleSheetsService');
const { getVerdict, adaptToMentorFeedback } = require('./services/chatgptService');
const { checkPlagiarism } = require('./services/plagiarismService');
const { compareRepositories } = require('./services/githubService');

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

app.post('/check-plagiarism', async (req, res) => {
  const { application, githubLink } = req.body;
  try {
    const plagiarismScore = await checkPlagiarism(githubLink);
    await writeGithubLinkAndPlagiarismScore(application.row, githubLink, plagiarismScore);
    res.json({ success: true, plagiarismScore });
  } catch (error) {
    console.error('Failed to check plagiarism:', error);
    res.status(500).json({ error: 'Failed to check plagiarism' });
  }
});

app.post('/mentor-feedback', async (req, res) => {
  const { application, mentorVerdict, mentorExplanation } = req.body;
  try {
    await writeVerdictAndExplanation(application.row, mentorVerdict, mentorExplanation);
    await adaptToMentorFeedback(application, mentorVerdict, mentorExplanation);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to process mentor feedback:', error);
    res.status(500).json({ error: 'Failed to process mentor feedback' });
  }
});

// Новый маршрут для сравнения репозиториев с использованием MOSS
app.post('/compare-repos', async (req, res) => {
  const { repo1, repo2 } = req.body;
  
  if (!repo1 || !repo2) {
    return res.status(400).json({ error: 'Both repository URLs are required' });
  }

  try {
    const result = await compareRepositories(repo1, repo2);
    res.json({ result });
  } catch (error) {
    console.error('Error comparing repositories:', error);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});