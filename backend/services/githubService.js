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
  
  async function isTextFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) return false;
      
      // Простая проверка на текстовый файл по расширению
      const textExtensions = ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.h', '.html', '.css', '.txt', '.md'];
      return textExtensions.includes(path.extname(filePath).toLowerCase());
    } catch (error) {
      console.error(`Error checking file ${filePath}:`, error);
      return false;
    }
  }

  async function getFilesRecursively(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Исключаем директорию node_modules и скрытые директории
        return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : getFilesRecursively(fullPath);
      }
      // Проверяем, является ли файл текстовым
      return (await isTextFile(fullPath)) ? fullPath : [];
    }));
    return files.flat();
  }
  
  const allFiles = await getFilesRecursively(repoPath);
  console.log(`Found ${allFiles.length} text files (excluding node_modules and non-text files)`);
  return allFiles;
}

async function runMoss(files1, files2) {
  console.log('Running MOSS comparison');
  const allFiles = [...files1, ...files2];
  const mossPath = path.join(__dirname, '..', 'moss.pl');
  console.log(`MOSS script path: ${mossPath}`);
  console.log(`Executing MOSS with ${allFiles.length} files`);

  // Словарь поддерживаемых MOSS языков
  const mossLanguages = {
    'c': ['c', 'h'],
    'cc': ['cpp', 'hpp', 'cxx'],
    'java': ['java'],
    'ml': ['ml'],
    'pascal': ['pas'],
    'ada': ['ada'],
    'lisp': ['lisp'],
    'scheme': ['scm'],
    'haskell': ['hs'],
    'fortran': ['f90', 'f95', 'f03'],
    'ascii': ['txt', 'md', 'text'],  // Обрабатываем Markdown и другие текстовые файлы как обычный текст
    'vhdl': ['vhdl'],
    'perl': ['pl'],
    'matlab': ['m'],
    'python': ['py'],
    'mips': ['s'],
    'prolog': ['pl'],
    'spice': ['sp'],
    'vb': ['vb'],
    'csharp': ['cs'],
    'modula2': ['mod'],
    'a8086': ['asm'],
    'javascript': ['js'],
    'plsql': ['sql']
  };

  // Группируем файлы по языку MOSS
  const fileGroups = allFiles.reduce((groups, file) => {
    const ext = path.extname(file).slice(1).toLowerCase();
    const lang = Object.entries(mossLanguages).find(([_, exts]) => exts.includes(ext));
    const mossLang = lang ? lang[0] : 'ascii';  // Если язык не распознан, используем 'ascii'
    if (!groups[mossLang]) groups[mossLang] = [];
    groups[mossLang].push(file);
    return groups;
  }, {});

  // Выполняем MOSS для каждой группы файлов
  const results = await Promise.all(
    Object.entries(fileGroups).map(async ([lang, files]) => {
      try {
        const { stdout, stderr } = await execPromise(`perl ${mossPath} -l ${lang} -c "Plagiat Check" ${files.join(' ')}`);
        if (stderr) {
          console.error(`MOSS Error for ${lang} files:`, stderr);
          return null;
        }
        return stdout.trim();
      } catch (error) {
        console.error(`Error processing ${lang} files:`, error.message);
        return null;
      }
    })
  );

  // Фильтруем успешные результаты и объединяем их
  const successfulResults = results.filter(Boolean);
  console.log('MOSS comparison completed successfully');
  return successfulResults.join('\n');
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
    const resultUrl = result.split('\n').pop();  // Берем последнюю строку вывода
    if (!resultUrl.startsWith('http://moss.stanford.edu/results/')) {
      throw new Error('Invalid MOSS result URL');
    }
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