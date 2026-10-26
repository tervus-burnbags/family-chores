'use strict';
// Stage ONLY deployable public files. Never upload the working directory's
// admin keys, family-code files, health exports, memories or debug artifacts.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const repo = path.resolve(__dirname,'../..');
const files = [
  'index.html','kid-fun-data.js','manifest.json','sw.js','favicon-32.png',
  'firebase-config.js','icons/apple-touch-icon.png','icons/icon-192.png',
  'icons/icon-512.png','fitness/index.html','fitness/nutrition.js',
  'fitness/manifest.json','fitness/sw.js','fitness/icon.svg',
  'fitness/icon-192.png','fitness/icon-512.png','api/fitness-foods.js',
  'package.json','package-lock.json','.vercel/project.json'
];
function stage() {
  for (const file of files) if (!fs.existsSync(path.join(repo,file))) throw new Error('Missing deployment input: '+file);
  const target = fs.mkdtempSync(path.join(os.tmpdir(),'family-hub-deploy-'));
  for (const file of files) {
    const destination = path.join(target,file);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.copyFileSync(path.join(repo,file),destination);
  }
  return {directory:target,fileCount:files.length,files};
}
if (require.main===module) {
  try {console.log(JSON.stringify(stage(),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={stage,files};
