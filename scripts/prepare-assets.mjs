import sharp from 'sharp';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const input = path.join(root, 'petals');
const output = path.join(root, 'public', 'assets');
await mkdir(output, { recursive: true });

// The source files stay untouched. Alpha-aware trim removes only the transparent margins.
const assets = [
  ['couple', 'ChatGPT Image Sep 20, 2026, 04_35_31 PM.png', 1200],
  ['couple-small', 'ChatGPT Image Sep 20, 2026, 04_35_31 PM.png', 640],
  ['clouds', 'ChatGPT Image Sep 20, 2026, 04_35_40 PM.png', 1100],
  ['pearl-left', 'ChatGPT Image Sep 20, 2026, 04_35_49 PM.png', 210],
  ['taupe-paper', 'ChatGPT Image Sep 20, 2026, 04_35_53 PM.png', 850],
  ['pearl-right', 'ChatGPT Image Sep 20, 2026, 04_35_57 PM.png', 210],
  ['pearl-garland', 'ChatGPT Image Sep 20, 2026, 04_36_00 PM.png', 900],
  ['letter', 'ChatGPT Image Sep 20, 2026, 04_36_03 PM.png', 850],
  ['pendant', 'ChatGPT Image Sep 20, 2026, 04_36_06 PM.png', 120],
  ['pearl-drape', 'ChatGPT Image Sep 20, 2026, 04_36_10 PM.png', 720],
  ['necklace', 'ChatGPT Image Sep 20, 2026, 04_36_12 PM.png', 430],
  ['envelope', 'ChatGPT Image Sep 20, 2026, 04_36_17 PM.png', 880],
  ['pearl-hearts', 'ChatGPT Image Sep 20, 2026, 04_36_19 PM.png', 900],
  ['swatch-charcoal', 'ChatGPT Image Sep 20, 2026, 04_36_23 PM.png', 160],
  ['swatch-forest', 'ChatGPT Image Sep 20, 2026, 04_36_26 PM.png', 160],
  ['swatch-olive', 'ChatGPT Image Sep 20, 2026, 04_36_30 PM.png', 160],
  ['swatch-teal', 'ChatGPT Image Sep 20, 2026, 04_36_40 PM.png', 160],
  ['swatch-chocolate', 'ChatGPT Image Sep 20, 2026, 04_36_43 PM.png', 160],
  ['swatch-taupe', 'ChatGPT Image Sep 20, 2026, 04_36_47 PM.png', 160],
  ['swatch-champagne', 'ChatGPT Image Sep 20, 2026, 04_36_51 PM.png', 160],
  ['venue-frame', 'WhatsApp Image 2026-09-20 at 16.01.04 (5).jpeg', 720],
  ['flower', 'ChatGPT Image Sep 20, 2026, 04_14_13 PM (3).png', 420],
  ['pearlheart', 'pearlheart-transparent.png', 128],
];

const only = process.argv.find(argument => argument.startsWith('--only='))?.slice(7);
if (only && !assets.some(([name]) => name === only)) throw new Error(`Unknown asset: ${only}`);
const manifest = only ? JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8')) : {};
for (const [name, filename, width] of assets) {
  if (only && name !== only) continue;
  const source = path.join(input, filename);
  const metadata = await sharp(source).metadata();
  let pipeline = sharp(source);
  if (metadata.hasAlpha) pipeline = pipeline.trim({ background: '#00000000', threshold: 10 });
  const info = await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 95 }).toFile(path.join(output, `${name}.webp`));
  manifest[name] = { width: info.width, height: info.height };
  console.log(`${name}: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
}
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await mkdir(path.join(root, 'src', 'data'), { recursive: true });
await writeFile(path.join(root, 'src', 'data', 'asset-dimensions.json'), JSON.stringify(manifest, null, 2) + '\n');
const licenses = path.join(root, 'public', 'licenses');
await mkdir(licenses, { recursive: true });
for (const font of ['cormorant-garamond', 'great-vibes', 'noto-serif-sinhala']) {
  await copyFile(path.join(root, 'node_modules', '@fontsource', font, 'LICENSE'), path.join(licenses, `${font}.txt`));
}
