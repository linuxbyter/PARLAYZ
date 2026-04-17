const fs = require('fs');
const path = require('path');

const extract = require('extract-zip');

async function main() {
  const zipPath = path.join(__dirname, 'parlayz.zip');
  const destPath = path.join(__dirname, 'temp_parlayz');
  
  try {
    await extract(zipPath, { dir: destPath });
    console.log('Extraction complete');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
