// Run with: node scripts/compress-images.js
// Requires: npm install sharp --save-dev

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../images');
const OUTPUT_DIR = path.join(__dirname, '../images');

const files = fs.readdirSync(INPUT_DIR).filter(f =>
  /\.(jpg|jpeg|png)$/i.test(f)
);

(async () => {
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputWebP = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    const stats = fs.statSync(inputPath);
    const sizeBefore = (stats.size / 1024).toFixed(1);

    await sharp(inputPath)
      .webp({ quality: 82 })
      .toFile(outputWebP);

    const sizeAfter = (fs.statSync(outputWebP).size / 1024).toFixed(1);
    console.log(`${file}: ${sizeBefore}KB → ${sizeAfter}KB (WebP)`);
  }
  console.log('Done! All images converted to WebP.');
})();
