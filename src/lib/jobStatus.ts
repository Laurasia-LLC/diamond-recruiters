import type { CollectionEntry } from 'astro:content';

type JobData = CollectionEntry<'jobs'>['data'];

/**
 * How long a posting stays live when the markdown does not name an explicit
 * end date. Google requires `validThrough`, and treats a posting with a stale
 * or missing end date as a quality problem across the whole domain — not just
 * that one listing. 45 days is the top of the recommended 30–45 day window.
 */
export const VALID_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The effective end date for a posting.
 *
 * Derived from `datePosted` unless the role names its own `validThrough`,
 * which means re-posting a role (bumping `datePosted`) automatically extends
 * the window without anyone having to remember a second date.
 */
export function validThroughFor(data: JobData): Date {
  if (data.validThrough) return data.validThrough;
  return new Date(data.datePosted.getTime() + VALID_DAYS * DAY_MS);
}

/** True once the posting is past its end date, or was closed by hand. */
export function isExpired(data: JobData, now: Date = new Date()): boolean {
  if (data.status !== 'open') return true;
  return now.getTime() > validThroughFor(data).getTime();
}

/**
 * A role that should appear in listings, the sitemap, and carry JobPosting
 * structured data.
 */
export function isLive(data: JobData, now: Date = new Date()): boolean {
  return !data.draft && !isExpired(data, now);
}

/** Days remaining before the posting expires. Negative once past. */
export function daysRemaining(data: JobData, now: Date = new Date()): number {
  return Math.ceil((validThroughFor(data).getTime() - now.getTime()) / DAY_MS);
}
