/**
 * Pushes job URLs to the Google Indexing API.
 *
 *   npm run notify:google -- --dry-run
 *   npm run notify:google
 *   npm run notify:google -- --force
 *
 * JobPosting is one of only two schema types the Indexing API accepts, so this
 * is the fastest route from "role published" to "role crawled" — typically
 * minutes instead of waiting on a sitemap cycle.
 *
 * Live roles are sent as URL_UPDATED. Closed or expired roles are sent as
 * URL_DELETED, which is what tells Google to drop the posting promptly rather
 * than leaving a stale listing in the feed.
 *
 * SETUP (once)
 *   1. Google Cloud console -> create a project -> enable "Indexing API"
 *   2. Create a service account, generate a JSON key
 *   3. Search Console -> the diamond-recruiters.com property -> Settings ->
 *      Users and permissions -> add the service account's client_email as an
 *      OWNER. Without this every call returns 403.
 *   4. Put the whole JSON key in the GOOGLE_SERVICE_ACCOUNT_JSON secret
 *
 * NOTE ON SITEMAP PINGING: Google retired the sitemap ping endpoint in 2023.
 * There is nothing to "resubmit" — Search Console re-reads a submitted sitemap
 * on its own schedule, and this API is the way to request fast crawling.
 *
 * Quota is 200 URLs/day by default.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readJobs, isLive, validThroughFor } from './lib/jobIndex.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SITE_URL = process.env.SITE_URL ?? 'https://diamond-recruiters.com';
const STATE_PATH = process.env.INDEXING_STATE_PATH ?? join(root, '.cache', 'indexing-state.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

async function loadServiceAccount() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON.');
    }
  }

  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return JSON.parse(await readFile(path, 'utf8'));

  throw new Error(
    'No credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON (the key file contents) ' +
      'or GOOGLE_APPLICATION_CREDENTIALS (a path to it).'
  );
}

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Signs a JWT assertion and exchanges it for an access token. */
async function getAccessToken(account) {
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(
    JSON.stringify(claims)
  )}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(account.private_key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Token exchange failed (${response.status}): ${body.error_description ?? JSON.stringify(body)}`
    );
  }
  return body.access_token;
}

async function publish(token, url, type) {
  const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type }),
  });

  if (response.ok) return { ok: true };

  const body = await response.text();
  let hint = '';
  if (response.status === 403) {
    hint = ' — is the service account an OWNER of the Search Console property?';
  } else if (response.status === 429) {
    hint = ' — daily quota exhausted (200/day by default)';
  }
  return { ok: false, error: `${response.status} ${body.slice(0, 200)}${hint}` };
}

// ---------------------------------------------------------------------------
// Work out what needs sending
// ---------------------------------------------------------------------------

const now = new Date();

const targets = readJobs(root)
  .filter(({ data }) => !data.draft)
  .map(({ slug, data }) => ({
    slug,
    url: `${SITE_URL}/jobs/${slug}`,
    type: isLive(data, now) ? 'URL_UPDATED' : 'URL_DELETED',
    // Any change to these means the posting materially changed.
    fingerprint: [
      new Date(data.datePosted).toISOString().slice(0, 10),
      validThroughFor(data).toISOString().slice(0, 10),
      data.status ?? 'open',
      isLive(data, now) ? 'live' : 'gone',
    ].join('|'),
  }));

let state = {};
if (!force) {
  try {
    state = JSON.parse(await readFile(STATE_PATH, 'utf8'));
  } catch {
    state = {};
  }
}

const pending = targets.filter((t) => force || state[t.slug] !== t.fingerprint);

console.log(`\n  ${targets.length} posting(s) on disk, ${pending.length} need notifying.`);
if (!force && pending.length < targets.length) {
  console.log('  (unchanged postings skipped — pass --force to send everything)');
}

if (pending.length === 0) {
  console.log('  Nothing to do.\n');
  process.exit(0);
}

for (const t of pending) {
  console.log(`    ${t.type.padEnd(12)} ${t.url}`);
}

if (dryRun) {
  console.log('\n  Dry run — nothing sent.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

let account;
try {
  account = await loadServiceAccount();
} catch (error) {
  console.error(`\n  ${error.message}\n`);
  process.exit(1);
}

const token = await getAccessToken(account);

let sent = 0;
const failures = [];

for (const t of pending) {
  const result = await publish(token, t.url, t.type);
  if (result.ok) {
    sent += 1;
    state[t.slug] = t.fingerprint;
    console.log(`    ok    ${t.type.padEnd(12)} ${t.url}`);
  } else {
    failures.push(`${t.url}: ${result.error}`);
    console.log(`    FAIL  ${t.type.padEnd(12)} ${t.url}`);
  }
}

await mkdir(dirname(STATE_PATH), { recursive: true });
await writeFile(STATE_PATH, JSON.stringify(state, null, 2));

console.log(`\n  ${sent}/${pending.length} notification(s) accepted by Google.`);

if (failures.length) {
  console.log('\n  FAILURES');
  for (const f of failures) console.log(`    x ${f}`);
  console.log('');
  process.exit(1);
}

console.log('');
