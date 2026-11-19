const fs = require('fs');
const path = require('path');

const foldersToClean = [
  'playwright-report',
  'test-results',
  'allure-results',
  'allure-report',
  'reports',
];

foldersToClean.forEach(folder => {
  const dirPath = path.resolve(process.cwd(), folder);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🧹 Nettoyé : ${folder}`);
    } catch (err) {
      console.warn(`⚠️ Impossible de supprimer ${folder} :`, err.message);
    }
  }
});
