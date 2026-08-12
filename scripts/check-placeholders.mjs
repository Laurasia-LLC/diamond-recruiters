/**
 * Fails the check if invented or unfinished content is still in the build.
 *
 *   npm run check:placeholders
 *
 * Run this before every go-live. It scans dist/ for the markers used by the
 * placeholder company data in src/consts.ts, so nothing fake can ship by
 * accident.
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Each pattern is a thing that must not reach production. */
const PATTERNS = [
  { label: 'PLACEHOLDER marker', re: /PLACEHOLDER/g },
  // Must not match a real salary like "$190,000+", so reject when the run of
  // zeros is part of a larger number.
  { label: 'fake stat "000+"', re: /(?<![\d,.])000\+/g },
  { label: 'fake stat "XX"', re: /(?<![A-Za-z])XX(?![A-Za-z])/g },
  { label: 'fake stat "00%"', re: /\b00%/g },
  { label: 'fake phone "(000) 000-0000"', re: /\(000\)\s*000-0000/g },
  { label: 'lorem ipsum', re: /lorem ipsum/gi },
  { label: 'TODO note', re: /\bTODO\b/g },
];

/** Files worth scanning — the rendered output a visitor could actually see. */
const SCAN_EXTENSIONS = ['.html', '.xml', '.txt', '.php'];

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
      // Hashed asset bundles are generated, not authored — skip them.
      if (entry.name === '_astro') continue;
      yield* walk(path);
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield path;
    }
  }
}

const findings = new Map();
let filesScanned = 0;

for await (const file of walk(dist)) {
  filesScanned += 1;
  const text = await readFile(file, 'utf8');

  for (const { label, re } of PATTERNS) {
    const matches = text.match(re);
    if (!matches) continue;

    if (!findings.has(label)) findings.set(label, new Map());
    const byFile = findings.get(label);
    const key = relative(dist, file).replace(/\\/g, '/');
    byFile.set(key, (byFile.get(key) ?? 0) + matches.length);
  }
}

if (filesScanned === 0) {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(2);
}

if (findings.size === 0) {
  console.log(`\n  No placeholders found across ${filesScanned} files. Safe to publish.\n`);
  process.exit(0);
}

let total = 0;
console.log('\n  PLACEHOLDERS STILL IN THE BUILD\n');

for (const [label, byFile] of findings) {
  const count = [...byFile.values()].reduce((a, b) => a + b, 0);
  total += count;
  console.log(`  ${label}  —  ${count} occurrence${count === 1 ? '' : 's'}`);
  for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${String(n).padStart(3)}x  ${file}`);
  }
  console.log('');
}

console.log(`  ${total} total across ${filesScanned} files scanned.`);
console.log('  Fix these in src/consts.ts, rebuild, and run this again.\n');

process.exit(1);
