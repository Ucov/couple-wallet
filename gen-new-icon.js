const sharp = require('sharp');
const path = require('path');

async function processIcons() {
  const original = 'C:/Users/unase/.gemini/antigravity/brain/761dd320-fd1d-4540-b33d-2bab5c1e55d7/.user_uploaded/media_1790850439161.jpg';
  
  const sizes = [
    { name: 'icon-32x32.png', size: 32 },
    { name: 'icon-180x180.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-192x192.png', size: 192 }
  ];

  for (const item of sizes) {
    await sharp(original)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join('public', item.name));
    console.log('Generated', item.name);
  }
}

processIcons().catch(console.error);
