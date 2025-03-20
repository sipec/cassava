import sharp from 'sharp';

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp('public/root.svg')
      .resize(size, size)
      .png()
      .toFile(`public/pwa-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);