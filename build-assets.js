import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Jimp } from 'jimp';

async function run() {
  try {
    console.log('--- STEP 1: Ensuring build/ directory exists ---');
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
    }

    const logoPath = 'public/assets/logo.png';
    console.log(`--- STEP 2: Verifying logo at ${logoPath} ---`);

    if (!fs.existsSync(logoPath)) {
      console.error(`\n[CRITICAL ERROR]: The logo file "${logoPath}" does NOT exist.`);
      console.error('Please upload the correct binary PNG manually. Do not create a fake replacement.');
      process.exit(1);
    }

    const size = fs.statSync(logoPath).size;
    console.log(`- File found. Size: ${size} bytes`);

    if (size < 1024) {
      console.error(`\n[CRITICAL ERROR]: "${logoPath}" is invalid or corrupted (size is less than 1KB: ${size} bytes).`);
      console.error('Please upload the correct binary PNG manually. Do not create a fake replacement.');
      process.exit(1);
    }

    // Attempt to read the image to verify it's a valid PNG
    let img;
    try {
      img = await Jimp.read(logoPath);
      console.log(`- Verified valid PNG image. Dimensions: ${img.bitmap.width}x${img.bitmap.height}`);
    } catch (err) {
      console.error(`\n[CRITICAL ERROR]: Failed to parse "${logoPath}" as a valid PNG image.`);
      console.error(`Error details: ${err.message}`);
      console.error('Please upload the correct binary PNG manually. Do not create a fake replacement.');
      process.exit(1);
    }

    console.log('--- STEP 3: Creating build/icon.png as transparent 1024x1024 with centered logo ---');
    const canvasSize = 1024;
    const canvas = new Jimp({ width: canvasSize, height: canvasSize, color: 0x00000000 });

    const logoWidth = img.bitmap.width;
    const logoHeight = img.bitmap.height;

    // Center the logo in the 1024x1024 canvas
    // If logo is larger than 1024 on any dimension, resize it to fit
    let resizedImg = img;
    if (logoWidth > 1024 || logoHeight > 1024) {
      console.log(`- Logo dimensions (${logoWidth}x${logoHeight}) exceed 1024px. Resizing to fit...`);
      resizedImg = img.resize({ width: 1024, height: 1024 });
    }

    const w = resizedImg.bitmap.width;
    const h = resizedImg.bitmap.height;
    const startX = Math.floor((canvasSize - w) / 2);
    const startY = Math.floor((canvasSize - h) / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = resizedImg.getPixelColor(x, y);
        canvas.setPixelColor(color, x + startX, y + startY);
      }
    }

    const iconPngPath = 'build/icon.png';
    await canvas.write(iconPngPath);
    console.log(`- Saved transparent centered icon.png to ${iconPngPath} (${fs.statSync(iconPngPath).size} bytes)`);

    console.log('--- STEP 4: Creating build/icon.ico with multiple sizes ---');
    const iconIcoPath = 'build/icon.ico';

    let convertCmd = 'convert';
    if (process.platform === 'win32') {
      try {
        execSync('magick --version', { stdio: 'ignore' });
        convertCmd = 'magick';
      } catch (e) {
        convertCmd = 'convert';
      }
    } else {
      if (fs.existsSync('/usr/bin/convert')) {
        convertCmd = '/usr/bin/convert';
      }
    }

    console.log(`Using ImageMagick command: "${convertCmd}" to compile ICO...`);
    execSync(`${convertCmd} ${iconPngPath} -define icon:auto-resize=16,32,48,64,128,256 ${iconIcoPath}`);
    console.log(`- Generated build/icon.ico successfully: ${fs.statSync(iconIcoPath).size} bytes`);

    console.log('--- BUILD ASSETS SUCCESSFUL ---');
  } catch (error) {
    console.error('An unexpected error occurred during asset generation:', error.stack || error.message);
    process.exit(1);
  }
}

run();
