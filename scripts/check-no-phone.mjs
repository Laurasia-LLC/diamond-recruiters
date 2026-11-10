/**
 * Fails if the public site build still contains the old marketing phone number.
 *
 *   npm run check:no-phone
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const FORBIDDEN = [
  { label: 'public phone +1 307 429 0181', re: /307\s*429\s*0181/g },
  { label: 'tel:+13074290181', re: /tel:\+13074290181/g },
  { label: 'Diana Herold', re: /Diana\s+Herold/gi },
];

const SCAN_EXTENSIONS = ['.html', '.xml', '.txt'];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_astro') continue;
      yield* walk(path);
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield path;
    }
  }
}

const findings = [];
let filesScanned = 0;

for await (const file of walk(dist)) {
  filesScanned += 1;
  const text = await readFile(file, 'utf8');
  for (const { label, re } of FORBIDDEN) {
    if (re.test(text)) {
      re.lastIndex = 0;
      findings.push({ label, file: relative(dist, file).replace(/\\/g, '/') });
    }
  }
}

if (filesScanned === 0) {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(2);
}

if (findings.length === 0) {
  console.log(`\n  No forbidden phone or Diana Herold across ${filesScanned} files.\n`);
  process.exit(0);
}

console.error('\n  Forbidden content found in dist/:\n');
for (const f of findings) {
  console.error(`    [${f.label}] ${f.file}`);
}
console.error('');
process.exit(1);
