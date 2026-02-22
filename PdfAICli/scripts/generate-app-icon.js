#!/usr/bin/env node
/**
 * SVG kaynak ikondan Android ve iOS icin PNG ikonlari uretir.
 * Kullanim: node scripts/generate-app-icon.js
 * Gereksinim: npm install --save-dev sharp --legacy-peer-deps
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'assets', 'icon', 'app-icon.svg');
const OUT_ICON = path.join(ROOT, 'assets', 'icon');

// Android mipmap: [folder suffix, size in px]
const ANDROID_SIZES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

// iOS AppIcon sizes (filename without extension = size)
const IOS_SIZES = [
  ['Icon-40.png', 40],
  ['Icon-58.png', 58],
  ['Icon-60.png', 60],
  ['Icon-80.png', 80],
  ['Icon-87.png', 87],
  ['Icon-120.png', 120],
  ['Icon-180.png', 180],
  ['Icon-1024.png', 1024],
];

async function main() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error('SVG bulunamadi:', SVG_PATH);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  // 1024x1024 ana PNG (assets/icon)
  const out1024 = path.join(OUT_ICON, 'tahlil_analizi_icon_1024.png');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(out1024);
  console.log('Yazildi:', out1024);

  // Android mipmap
  const androidRes = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
  for (const [folder, size] of ANDROID_SIZES) {
    const dir = path.join(androidRes, `mipmap-${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    await fs.promises.writeFile(path.join(dir, 'ic_launcher.png'), png);
    await fs.promises.writeFile(path.join(dir, 'ic_launcher_round.png'), png);
    console.log('Android:', `mipmap-${folder}`, size + 'px');
  }

  // iOS AppIcon
  const iosIconSet = path.join(ROOT, 'ios', 'PdfAICli', 'Images.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosIconSet)) {
    for (const [filename, size] of IOS_SIZES) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iosIconSet, filename));
      console.log('iOS:', filename, size + 'px');
    }
  } else {
    console.warn('iOS AppIcon.appiconset bulunamadi, atlaniyor.');
  }

  console.log('Ikon uretimi tamamlandi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
