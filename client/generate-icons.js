// Run with: node generate-icons.js
// Requires: npm install sharp --legacy-peer-deps
const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, 'public/icons/icon.svg');

(async () => {
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `public/icons/icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }
  console.log('All icons generated!');
})();
