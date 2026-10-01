const sharp = require('sharp');
sharp('C:/Users/unase/.gemini/antigravity/brain/761dd320-fd1d-4540-b33d-2bab5c1e55d7/.user_uploaded/media_1790848675903.png')
  .resize({width: 192, height: 192, fit: 'contain', background: {r:0,g:0,b:0,alpha:0}})
  .toFile('public/favicon-192x192.png');
