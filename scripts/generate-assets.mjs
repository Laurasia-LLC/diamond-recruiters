/**
 * Generates the raster brand assets that cannot be served as SVG:
 * the social share card, the Apple touch icon and the schema.org logo.
 *
 *   npm run assets
 *
 * Re-run after changing the logo or the tagline.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');

const INK = '#0a1a2b';
const INK_DEEP = '#05101c';
const ICE = '#2b9bd4';
const ICE_PALE = '#d6eefa';
const SAND = '#f3efe8';

/** The brilliant-cut mark, drawn at an arbitrary scale/offset. */
const diamond = (x, y, size, strokeWidth) => `
  <g transform="translate(${x} ${y}) scale(${size / 32})">
    <path d="M16 2.5 L29.5 12.5 L16 29.5 L2.5 12.5 Z" fill="${ICE}" fill-opacity="0.22"/>
    <path d="M8.4 6.6 H23.6 L29.5 12.5 H2.5 Z" fill="${ICE}"/>
    <g stroke="${ICE_PALE}" stroke-width="${strokeWidth}" stroke-linejoin="round" fill="none">
      <path d="M16 2.5 L29.5 12.5 L16 29.5 L2.5 12.5 Z"/>
      <path d="M2.5 12.5 H29.5"/>
      <path d="M16 2.5 L10.6 12.5 L16 29.5"/>
      <path d="M16 2.5 L21.4 12.5 L16 29.5"/>
    </g>
  </g>`;

/* -------------------------------------------------------------------------
   Social share card — 1200x630, the Open Graph standard.
   ---------------------------------------------------------------------- */
const ogCard = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK}"/>
      <stop offset="55%" stop-color="${INK_DEEP}"/>
      <stop offset="100%" stop-color="#0f2438"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ICE}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${ICE}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1010" cy="120" r="330" fill="url(#glow)"/>

  <!-- faint facet lines, echoing the mark -->
  <g stroke="${ICE}" stroke-opacity="0.10" stroke-width="1.5" fill="none">
    <path d="M980 -40 L1240 260 L980 620"/>
    <path d="M1080 -40 L1340 260 L1080 620"/>
  </g>

  ${diamond(80, 74, 68, 1.15)}

  <text x="164" y="106" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="600" fill="#ffffff" letter-spacing="-0.4">Diamond Recruiters</text>
  <text x="164" y="134" font-family="Consolas, Menlo, monospace"
        font-size="14" font-weight="500" fill="${ICE}" letter-spacing="2.4">TECHNICAL SALES SEARCH</text>

  <text x="80" y="308" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="64" font-weight="600" fill="#ffffff" letter-spacing="-1.6">The sales engineers who</text>
  <text x="80" y="384" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="64" font-weight="600" fill="#ffffff" letter-spacing="-1.6">can read a plant floor</text>
  <text x="80" y="460" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="64" font-weight="600" fill="${ICE}" letter-spacing="-1.6">— and close the fix.</text>

  <rect x="80" y="524" width="52" height="3" fill="${ICE}"/>
  <text x="80" y="572" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="23" fill="#b3cbdd">Automation · Process Instrumentation · Flow Control · United States</text>
</svg>`;

/* -------------------------------------------------------------------------
   Square logo — used by schema.org and as the Apple touch icon.
   ---------------------------------------------------------------------- */
const squareLogo = (size, bg) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${bg === SAND ? 0 : 112}" fill="${bg}"/>
  ${diamond(96, 96, 320, 1.25)}
</svg>`;

await mkdir(out, { recursive: true });

const jobs = [
  ['og-default.png', ogCard, 1200, 630],
  ['apple-touch-icon.png', squareLogo(180, INK), 180, 180],
  ['logo-512.png', squareLogo(512, INK), 512, 512],
  ['favicon-96.png', squareLogo(96, INK), 96, 96],
];

for (const [name, svg, w, h] of jobs) {
  const buffer = await sharp(Buffer.from(svg)).resize(w, h).png({ quality: 92 }).toBuffer();
  await writeFile(join(out, name), buffer);
  console.log(`  ${name.padEnd(24)} ${w}x${h}  ${(buffer.length / 1024).toFixed(1)} kB`);
}

console.log('\nBrand assets written to public/');
