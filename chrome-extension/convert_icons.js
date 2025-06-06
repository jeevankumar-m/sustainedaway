import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, 'icons', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function convertIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'icons', `icon${size}.png`));
    console.log(`Created icon${size}.png`);
  }
}

convertIcons().catch(console.error); 