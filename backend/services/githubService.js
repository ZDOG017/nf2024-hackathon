const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function downloadRepository(repoUrl) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
  await execPromise(`git clone ${repoUrl} ${tempDir}`);
  return tempDir;
}

async function getFilesFromRepo(repoPath) {
  const files = await fs.readdir(repoPath, { withFileTypes: true });
  const sourceFiles = files
    .filter(file => file.isFile() && file.name.endsWith('.js'))
    .map(file => path.join(repoPath, file.name));
  return sourceFiles;
}

async function runMoss(files1, files2) {
  const allFiles = [...files1, ...files2];
  const fileArgs = allFiles.join(' ');
  const mossPath = path.join(__dirname, '..', 'moss.pl');
  const { stdout, stderr } = await execPromise(`perl ${mossPath} -l javascript ${fileArgs}`);

  if (stderr) {
    console.error('MOSS Error:', stderr);
    throw new Error('Error running MOSS');
  }

  return stdout;
}

async function compareRepositories(repo1Url, repo2Url) {
  const repo1Path = await downloadRepository(repo1Url);
  const repo2Path = await downloadRepository(repo2Url);

  try {
    const files1 = await getFilesFromRepo(repo1Path);
    const files2 = await getFilesFromRepo(repo2Path);

    const result = await runMoss(files1, files2);

    // Извлекаем URL результата из вывода MOSS
    const resultUrlMatch = result.match(/http:\/\/moss\.stanford\.edu\/results\/[0-9]+/);
    const resultUrl = resultUrlMatch ? resultUrlMatch[0] : 'No result URL found';

    return `MOSS comparison completed. Result URL: ${resultUrl}`;
  } finally {
    await fs.rmdir(repo1Path, { recursive: true });
    await fs.rmdir(repo2Path, { recursive: true });
  }
}

module.exports = { compareRepositories };