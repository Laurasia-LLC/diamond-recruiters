import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Imported directly rather than via astro:content, whose `z` re-export is
// deprecated in Astro 7.
import { z } from 'zod';

/**
 * One markdown file per open role. Drop a new file into src/content/jobs/
 * and the listing, the detail page, the sitemap and the Google Jobs
 * structured data all pick it up on the next build.
 */
const jobs = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/jobs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Short label used on cards and filters, e.g. "Automation & Sensors". */
      discipline: z.string(),
      /** One or two sentences. Shown on cards and used as the meta description. */
      summary: z.string(),

      /** Human-readable territory line, e.g. "Texas Gulf Coast". */
      territoryLabel: z.string(),
      /** Filterable territory tags. */
      territories: z.array(z.string()).min(1),
      /** Named cities, where the ad names them. Feeds JobPosting jobLocation. */
      locations: z
        .array(z.object({ city: z.string(), region: z.string() }))
        .default([]),

      baseMin: z.number(),
      baseMax: z.number(),
      oteMin: z.number(),
      oteMax: z.number(),
      /** Free text where OTE varies by territory. */
      oteNote: z.string().optional(),

      travel: z.string(),
      experience: z.string(),
      employmentType: z.string().default('FULL_TIME'),

      sectors: z.array(z.string()).default([]),
      /** Three to five scannable facts for the detail-page fact strip. */
      highlights: z.array(z.string()).default([]),

      heroImage: image(),
      heroAlt: z.string(),

      datePosted: z.coerce.date(),
      /** Google de-lists postings with no validThrough after ~30 days. */
      validThrough: z.coerce.date(),

      featured: z.boolean().default(false),
      /** Lower sorts first on the listing page. */
      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

export const collections = { jobs };
