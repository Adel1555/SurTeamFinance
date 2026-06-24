import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Jimp } from 'jimp';

const width = 512;
const height = 512;

// Utility functions for drawing on Jimp
function drawFilledCircle(img, cx, cy, r, color) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          img.setPixelColor(color, x, y);
        }
      }
    }
  }
}

function drawFilledRect(img, x1, y1, w, h, color) {
  for (let y = y1; y < y1 + h; y++) {
    for (let x = x1; x < x1 + w; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        img.setPixelColor(color, x, y);
      }
    }
  }
}

function drawFilledTrapezoid(img, y1, y2, xl1, xr1, xl2, xr2, color) {
  for (let y = y1; y <= y2; y++) {
    const t = (y - y1) / (y2 - y1);
    const xl = Math.round(xl1 + t * (xl2 - xl1));
    const xr = Math.round(xr1 + t * (xr2 - xr1));
    for (let x = xl; x <= xr; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        img.setPixelColor(color, x, y);
      }
    }
  }
}

function drawFilledDome(img, cx, cy, r, color) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= cy; y++) {
    const dx = Math.round(Math.sqrt(r2 - (y - cy) * (y - cy)));
    for (let x = cx - dx; x <= cx + dx; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        img.setPixelColor(color, x, y);
      }
    }
  }
}

function drawBezierSwoosh(img, p0, p1, p2, startR, midR, endR, color) {
  const steps = 600;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier curve
    const x = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
    const y = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);
    
    // Smoothly interpolate radius: grows from startR to midR, then shrinks to endR
    let r;
    if (t < 0.5) {
      const nt = t * 2;
      r = startR + nt * (midR - startR);
    } else {
      const nt = (t - 0.5) * 2;
      r = midR + nt * (endR - midR);
    }
    
    drawFilledCircle(img, x, y, r, color);
  }
}

async function run() {
  try {
    console.log('Ensuring build directory exists...');
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
    }

    console.log('Creating a transparent 512x512 image using Jimp...');
    const img = new Jimp({ width, height, color: 0x00000000 });

    // COLOR PALETTE (RGBA Hex in Jimp)
    const EMERALD_GREEN = 0x059669ff; // Omani green
    const CRIMSON_RED = 0xdc2626ff;    // Omani red
    const TOWER_CREAM = 0xfcfcfaff;    // Watchtower main body
    const TOWER_SHADOW = 0xe5e7ebff;   // Watchtower shadow side
    const DOME_SLATE = 0x4b5563ff;     // Roof dome
    const BASE_GREY = 0x9ca3afff;      // Stone grey platform/balcony
    const WINDOW_DARK = 0x111827ff;    // Window glass
    const GOLD_SPIRE = 0xfbbf24ff;     // Gold sphere

    console.log('Drawing dynamic tapered left green swoosh...');
    // Left green swoosh wrapping from bottom left around tower up to top center
    drawBezierSwoosh(
      img,
      { x: 230, y: 450 },
      { x: 60, y: 250 },
      { x: 256, y: 90 },
      2, 38, 2,
      EMERALD_GREEN
    );

    console.log('Drawing dynamic tapered right red swoosh...');
    // Right red swoosh wrapping from bottom right around tower up to top center
    drawBezierSwoosh(
      img,
      { x: 282, y: 450 },
      { x: 452, y: 250 },
      { x: 256, y: 90 },
      2, 38, 2,
      CRIMSON_RED
    );

    console.log('Drawing watchtower platform base...');
    // Base platform (y: 410 to 425)
    drawFilledTrapezoid(img, 410, 425, 175, 337, 185, 327, BASE_GREY);

    console.log('Drawing watchtower main body...');
    // Tapered tower body (y: 160 to 410)
    // Left side cream white, right side light shadow for 3D depth
    drawFilledTrapezoid(img, 160, 410, 212, 256, 200, 256, TOWER_CREAM);
    drawFilledTrapezoid(img, 160, 410, 256, 300, 256, 312, TOWER_SHADOW);

    console.log('Drawing balcony/deck at top...');
    // Balcony slab
    drawFilledRect(img, 202, 145, 108, 15, BASE_GREY);
    // Railing posts
    const posts = [208, 226, 244, 262, 280, 298];
    posts.forEach(p => {
      drawFilledRect(img, p, 145, 2, 15, 0x7b828bff);
    });

    console.log('Drawing tower dome roof...');
    drawFilledDome(img, 256, 145, 40, DOME_SLATE);

    console.log('Drawing spire and gold sphere on top...');
    drawFilledRect(img, 255, 55, 3, 25, BASE_GREY);
    drawFilledCircle(img, 256, 53, 5, GOLD_SPIRE);

    console.log('Drawing arched window 1 (top)...');
    drawFilledRect(img, 245, 205, 22, 25, WINDOW_DARK);
    drawFilledDome(img, 256, 205, 11, WINDOW_DARK);

    console.log('Drawing arched window 2 (bottom)...');
    drawFilledRect(img, 243, 290, 26, 30, WINDOW_DARK);
    drawFilledDome(img, 256, 290, 13, WINDOW_DARK);

    console.log('Saving generated PNG to build/icon.png...');
    await img.write('build/icon.png');

    console.log('Copying build/icon.png to public/assets/logo.png and dist/assets/logo.png...');
    fs.copyFileSync('build/icon.png', 'public/assets/logo.png');
    
    if (!fs.existsSync('dist/assets')) {
      fs.mkdirSync('dist/assets', { recursive: true });
    }
    fs.copyFileSync('build/icon.png', 'dist/assets/logo.png');

    console.log('Using ImageMagick to compile Windows build/icon.ico supporting all standard sizes...');
    execSync('/usr/bin/convert -background none build/icon.png -define icon:auto-resize=16,32,48,64,128,256 build/icon.ico');

    const iconPngSize = fs.statSync('build/icon.png').size;
    const logoPngSize = fs.statSync('public/assets/logo.png').size;
    const iconIcoSize = fs.statSync('build/icon.ico').size;

    console.log(`\nVerification Results:`);
    console.log(`- build/icon.png created successfully: ${iconPngSize} bytes`);
    console.log(`- public/assets/logo.png updated successfully: ${logoPngSize} bytes`);
    console.log(`- build/icon.ico created successfully: ${iconIcoSize} bytes`);

  } catch (error) {
    console.error('An error occurred during asset generation:', error.stack || error.message);
    process.exit(1);
  }
}

run();
