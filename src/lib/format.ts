/** Compact USD for salary chips: 80000 -> "$80K", 190000 -> "$190K". */
export function usdCompact(n: number): string {
  return `$${Math.round(n / 1000)}K`;
}

/** Range as "$80K – $105K", collapsing to a single figure when both match. */
export function usdRange(min: number, max: number): string {
  return min === max ? usdCompact(min) : `${usdCompact(min)} – ${usdCompact(max)}`;
}

/** "August 12, 2026" */
export function longDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** ISO date only (YYYY-MM-DD) for structured data and <time datetime>. */
export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
