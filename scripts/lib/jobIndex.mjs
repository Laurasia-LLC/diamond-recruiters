/**
 * Reads job frontmatter straight off disk.
 *
 * Used by astro.config.mjs (to filter the sitemap), the schema validator and
 * the Indexing API notifier — all of which run outside Astro's content layer
 * and so cannot use src/lib/jobStatus.ts.
 *
 * IMPORTANT: VALID_DAYS must match the value in src/lib/jobStatus.ts.
 * `npm run validate:schema` fails the build if the two ever drift apart.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export const VALID_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

export function validThroughFor(data) {
  if (data.validThrough) return toDate(data.validThrough);
  return new Date(toDate(data.datePosted).getTime() + VALID_DAYS * DAY_MS);
}

export function isExpired(data, now = new Date()) {
  if ((data.status ?? 'open') !== 'open') return true;
  return now.getTime() > validThroughFor(data).getTime();
}

export function isLive(data, now = new Date()) {
  return !data.draft && !isExpired(data, now);
}

/** Every non-draft role on disk, with its slug and parsed frontmatter. */
export function readJobs(root = process.cwd()) {
  const dir = join(root, 'src', 'content', 'jobs');
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .map((name) => {
      const { data } = matter(readFileSync(join(dir, name), 'utf8'));
      return { slug: name.replace(/\.md$/, ''), data };
    });
}

/** Slugs that should be indexed: live, non-draft roles. */
export function liveSlugs(root = process.cwd(), now = new Date()) {
  return readJobs(root)
    .filter(({ data }) => isLive(data, now))
    .map(({ slug }) => slug);
}

/** Slugs that exist but must NOT be indexed (closed, filled or expired). */
export function expiredSlugs(root = process.cwd(), now = new Date()) {
  return readJobs(root)
    .filter(({ data }) => !data.draft && isExpired(data, now))
    .map(({ slug }) => slug);
}
