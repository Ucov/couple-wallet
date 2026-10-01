const sharp = require('sharp');
const path = require('path');

async function processIcons() {
  const original = 'C:/Users/unase/.gemini/antigravity/brain/761dd320-fd1d-4540-b33d-2bab5c1e55d7/.user_uploaded/media_1790848675903.png';
  
  const sizes = [
    { name: 'icon-32x32.png', size: 32 },
    { name: 'icon-180x180.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 }
  ];

  for (const item of sizes) {
    await sharp(original)
      .resize({
        width: item.size,
        height: item.size,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join('public', item.name));
    console.log('Generated', item.name);
  }
  
  // also generate favicon.ico (can just be a 32x32 png, NextJS will serve it fine)
  await sharp(original)
    .resize({ width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join('public', 'favicon.ico'));
    
  await sharp(original)
    .resize({ width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join('src/app', 'favicon.ico'));
}

processIcons().catch(console.error);
