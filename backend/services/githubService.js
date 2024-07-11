const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function downloadRepository(repoUrl) {
  console.log(`Downloading repository: ${repoUrl}`);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
  console.log(`Created temporary directory: ${tempDir}`);
  await execPromise(`git clone ${repoUrl} ${tempDir}`);
  console.log(`Repository cloned to: ${tempDir}`);
  return tempDir;
}

async function getFilesFromRepo(repoPath) {
  console.log(`Getting files from repository: ${repoPath}`);
  const files = await fs.readdir(repoPath, { withFileTypes: true });
  const sourceFiles = files
    .filter(file => file.isFile() && file.name.endsWith('.js'))
    .map(file => path.join(repoPath, file.name));
  console.log(`Found ${sourceFiles.length} JavaScript files`);
  return sourceFiles;
}

async function runMoss(files1, files2) {
  console.log('Running MOSS comparison');
  const allFiles = [...files1, ...files2];
  const fileArgs = allFiles.join(' ');
  const mossPath = path.join(__dirname, '..', 'moss.pl');
  console.log(`MOSS script path: ${mossPath}`);
  console.log(`Executing MOSS with ${allFiles.length} files`);
  const { stdout, stderr } = await execPromise(`perl ${mossPath} -l javascript ${fileArgs}`);
  
  if (stderr) {
    console.error('MOSS Error:', stderr);
    throw new Error('Error running MOSS');
  }

  console.log('MOSS comparison completed successfully');
  return stdout;
}

async function compareRepositories(repo1Url, repo2Url) {
  console.log(`Starting comparison of repositories: ${repo1Url} and ${repo2Url}`);
  const repo1Path = await downloadRepository(repo1Url);
  const repo2Path = await downloadRepository(repo2Url);

  try {
    console.log('Getting files from repositories');
    const files1 = await getFilesFromRepo(repo1Path);
    const files2 = await getFilesFromRepo(repo2Path);

    console.log('Running MOSS comparison');
    const result = await runMoss(files1, files2);

    console.log('Parsing MOSS result');
    const resultUrlMatch = result.match(/http:\/\/moss\.stanford\.edu\/results\/[0-9]+/);
    const resultUrl = resultUrlMatch ? resultUrlMatch[0] : 'No result URL found';

    console.log(`MOSS result URL: ${resultUrl}`);
    return `MOSS comparison completed. Result URL: ${resultUrl}`;
  } catch (error) {
    console.error('Error during repository comparison:', error);
    throw error;
  } finally {
    console.log('Cleaning up temporary directories');
    try {
      await fs.rm(repo1Path, { recursive: true, force: true });
      await fs.rm(repo2Path, { recursive: true, force: true });
      console.log('Temporary directories removed successfully');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

module.exports = { compareRepositories };