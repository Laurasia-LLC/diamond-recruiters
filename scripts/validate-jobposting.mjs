/**
 * Validates the JobPosting structured data in the built site against Google's
 * documented requirements for job posting rich results.
 *
 *   npm run validate:schema
 *
 * This is a local gate that runs in CI on every push. It is NOT a substitute
 * for Google's Rich Results Test, which needs a publicly reachable URL — run
 * that once after the first deploy, and after any change to the schema
 * builder. This script catches the failures that test would catch, before
 * they ever reach production.
 *
 * Zero JobPosting blocks is a success when the build produced HTML and every
 * non-draft role is expired, closed, or absent. A missing dist/, a live role
 * with no schema, or a schema block that breaks Google's rules still fails.
 *
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { VALID_DAYS, readJobs, isLive, validThroughFor } from './lib/jobIndex.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** Google's required properties for JobPosting. */
const REQUIRED = ['title', 'description', 'datePosted', 'hiringOrganization'];

/** Strongly recommended — we treat missing ones as failures for this site. */
const RECOMMENDED = ['validThrough', 'employmentType', 'baseSalary', 'identifier'];

const VALID_EMPLOYMENT_TYPES = new Set([
  'FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN',
  'VOLUNTEER', 'PER_DIEM', 'OTHER',
]);

const errors = [];
const warnings = [];
let checked = 0;
let htmlFiles = 0;
/** Job slugs whose built page actually contains a JobPosting block. */
const seenSchema = new Set();

const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

/** Astro escapes "&" as "&#38;", so raw string comparison needs decoding. */
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch (e) {
      blocks.push({ __parseError: e.message });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// 1. VALID_DAYS must not drift between the TS and MJS copies
// ---------------------------------------------------------------------------
const tsSource = await readFile(join(root, 'src', 'lib', 'jobStatus.ts'), 'utf8');
const tsValidDays = Number(tsSource.match(/VALID_DAYS\s*=\s*(\d+)/)?.[1]);
if (tsValidDays !== VALID_DAYS) {
  fail(
    'config',
    `VALID_DAYS mismatch — src/lib/jobStatus.ts says ${tsValidDays}, scripts/lib/jobIndex.mjs says ${VALID_DAYS}. They must match.`
  );
}
if (VALID_DAYS < 30 || VALID_DAYS > 45) {
  warn('config', `VALID_DAYS is ${VALID_DAYS}; Google guidance favours a 30–45 day window.`);
}

// ---------------------------------------------------------------------------
// 2. Walk the built HTML
// ---------------------------------------------------------------------------
const seenJobPages = new Set();

for await (const file of walk(dist)) {
  htmlFiles += 1;
  const rel = relative(dist, file).replace(/\\/g, '/');
  const html = await readFile(file, 'utf8');
  const isJobPage = /^jobs\/[^/]+\/index\.html$/.test(rel);
  const blocks = extractJsonLd(html);

  for (const b of blocks) {
    if (b.__parseError) fail(rel, `invalid JSON-LD: ${b.__parseError}`);
  }

  const posting = blocks.find((b) => b && b['@type'] === 'JobPosting');

  if (!isJobPage) {
    if (posting) fail(rel, 'JobPosting schema on a page that is not a job page');
    continue;
  }

  const slug = rel.split('/')[1];
  seenJobPages.add(slug);

  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);

  if (!posting) {
    // Legitimate only when the page is deliberately de-listed.
    if (!noindex) {
      fail(rel, 'no JobPosting schema and no noindex — the page is indexable but has no markup');
    }
    continue;
  }

  checked += 1;
  seenSchema.add(slug);
  const where = `jobs/${slug}`;

  if (noindex) fail(where, 'carries JobPosting schema AND noindex — contradictory');

  // -- required -------------------------------------------------------------
  for (const key of REQUIRED) {
    if (posting[key] === undefined || posting[key] === '') fail(where, `missing required "${key}"`);
  }
  for (const key of RECOMMENDED) {
    if (posting[key] === undefined) warn(where, `missing recommended "${key}"`);
  }

  // -- location rules -------------------------------------------------------
  const hasLocation = posting.jobLocation !== undefined;
  const hasLocationType = posting.jobLocationType !== undefined;

  if (!hasLocation && !hasLocationType) {
    fail(where, 'must have either jobLocation or jobLocationType');
  }
  if (hasLocation && hasLocationType) {
    fail(where, 'jobLocation and jobLocationType must never both be present');
  }
  if (hasLocationType && posting.jobLocationType !== 'TELECOMMUTE') {
    fail(where, `jobLocationType must be "TELECOMMUTE", got "${posting.jobLocationType}"`);
  }
  if (posting.applicantLocationRequirements && !hasLocationType) {
    fail(where, 'applicantLocationRequirements is only valid on a remote (TELECOMMUTE) posting');
  }

  if (hasLocation) {
    const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation];
    if (locations.length === 0) fail(where, 'jobLocation is an empty array');
    for (const loc of locations) {
      if (loc['@type'] !== 'Place') fail(where, 'each jobLocation must be @type Place');
      if (!loc.address) fail(where, 'jobLocation.address is required');
      else if (!loc.address.addressCountry) fail(where, 'jobLocation.address.addressCountry is required');
    }
  }

  // -- dates ----------------------------------------------------------------
  const posted = new Date(posting.datePosted);
  if (Number.isNaN(posted.getTime())) fail(where, `datePosted is not a valid date: ${posting.datePosted}`);

  if (posting.validThrough) {
    const through = new Date(posting.validThrough);
    if (Number.isNaN(through.getTime())) {
      fail(where, `validThrough is not a valid date: ${posting.validThrough}`);
    } else {
      if (through <= posted) fail(where, 'validThrough must be after datePosted');
      if (through < new Date()) {
        fail(where, `validThrough is in the past (${posting.validThrough}) but the page still carries schema`);
      }
      const days = Math.round((through - posted) / 86400000);
      if (days > 60) warn(where, `validThrough is ${days} days after datePosted; keep it under ~45`);
    }
  }

  // -- other fields ---------------------------------------------------------
  if (posting.employmentType && !VALID_EMPLOYMENT_TYPES.has(posting.employmentType)) {
    fail(where, `employmentType "${posting.employmentType}" is not a valid schema.org value`);
  }

  if (typeof posting.description !== 'string' || posting.description.length < 250) {
    fail(where, `description is thin (${posting.description?.length ?? 0} chars); Google penalises stub postings`);
  }
  if (typeof posting.description === 'string' && !/<(p|ul|li|h[1-6]|br)\b/i.test(posting.description)) {
    warn(where, 'description contains no HTML formatting; Google prefers formatted descriptions');
  }

  const org = posting.hiringOrganization;
  if (org && org['@type'] !== 'Organization') fail(where, 'hiringOrganization must be @type Organization');
  if (org && !org.name) fail(where, 'hiringOrganization.name is required');

  if (posting.baseSalary) {
    const v = posting.baseSalary.value;
    if (!v) fail(where, 'baseSalary.value is required');
    else {
      if (v['@type'] !== 'QuantitativeValue') fail(where, 'baseSalary.value must be @type QuantitativeValue');
      if (!v.unitText) fail(where, 'baseSalary.value.unitText is required (e.g. YEAR)');
      if (v.minValue !== undefined && v.maxValue !== undefined && v.minValue > v.maxValue) {
        fail(where, 'baseSalary minValue is greater than maxValue');
      }
    }
    if (!posting.baseSalary.currency) fail(where, 'baseSalary.currency is required');
  }

  // -- canonical ------------------------------------------------------------
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (!canonical) fail(where, 'no canonical tag');
  else if (posting.url && canonical.replace(/\/$/, '') !== String(posting.url).replace(/\/$/, '')) {
    fail(where, `canonical (${canonical}) does not match JobPosting.url (${posting.url})`);
  }

  // Job content must be in the HTML, not injected by JS.
  const plain = decodeEntities(
    html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
  );
  if (!plain.includes(decodeEntities(posting.title))) {
    fail(where, 'job title does not appear in the rendered HTML body — content may be JS-only');
  }

  // The body copy must be server-rendered too, not just the title.
  const bodyText = plain.replace(/\s+/g, ' ').trim();
  if (bodyText.length < 1500) {
    fail(where, `rendered text is only ${bodyText.length} chars; Google penalises thin job pages`);
  }
}

// ---------------------------------------------------------------------------
// 3. Cross-check against the source files
// ---------------------------------------------------------------------------
const now = new Date();
for (const { slug, data } of readJobs(root)) {
  if (data.draft) continue;
  const shouldBeLive = isLive(data, now);
  if (shouldBeLive && !seenJobPages.has(slug)) {
    fail('build', `live role "${slug}" has no built page at dist/jobs/${slug}/`);
  }
  if (shouldBeLive && seenJobPages.has(slug) && !seenSchema.has(slug)) {
    fail('build', `live role "${slug}" is missing JobPosting schema`);
  }
}

// ---------------------------------------------------------------------------
// 4. Sitemap must not list expired roles
// ---------------------------------------------------------------------------
try {
  const sitemapFiles = (await readdir(dist)).filter((f) => /^sitemap.*\.xml$/.test(f));
  let sitemapXml = '';
  for (const f of sitemapFiles) sitemapXml += await readFile(join(dist, f), 'utf8');

  for (const { slug, data } of readJobs(root)) {
    if (data.draft) continue;
    const inSitemap = sitemapXml.includes(`/jobs/${slug}`);
    if (!isLive(data, now) && inSitemap) {
      fail('sitemap', `expired role "${slug}" is still listed in the sitemap`);
    }
    if (isLive(data, now) && !inSitemap) {
      fail('sitemap', `live role "${slug}" is missing from the sitemap`);
    }
  }
} catch (e) {
  warn('sitemap', `could not read sitemap: ${e.message}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (htmlFiles === 0) {
  console.log('\n  No HTML found in dist/. Did the build run?\n');
  process.exit(1);
}

console.log('');
if (warnings.length) {
  console.log('  WARNINGS');
  for (const w of warnings) console.log(`    ! ${w}`);
  console.log('');
}

if (errors.length) {
  console.log('  ERRORS');
  for (const e of errors) console.log(`    x ${e}`);
  console.log(`\n  ${errors.length} error(s) across ${checked} JobPosting block(s).\n`);
  process.exit(1);
}

if (checked === 0) {
  const inactive = readJobs(root).filter(({ data }) => !data.draft && !isLive(data, now));
  console.log('  No active JobPosting blocks in the build.');
  if (inactive.length === 0) {
    console.log('  No non-draft roles are on disk. An empty board is valid.');
  } else {
    console.log('  Every non-draft role is expired or closed, so none carry schema:');
    for (const { slug, data } of inactive) {
      const through = validThroughFor(data);
      const throughLabel = Number.isNaN(through.getTime())
        ? 'unknown'
        : through.toISOString().slice(0, 10);
      console.log(`    - ${slug} (status ${data.status ?? 'open'}, validThrough ${throughLabel})`);
    }
  }
  console.log('  A live role with missing or invalid schema still fails this check.\n');
  process.exit(0);
}

console.log(`  ${checked} JobPosting block(s) valid against Google's requirements.`);
console.log('  Still run the Rich Results Test on the live URLs after first deploy.\n');
