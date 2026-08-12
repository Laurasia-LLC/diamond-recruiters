// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { expiredSlugs, readJobs } from './scripts/lib/jobIndex.mjs';

/**
 * Roles that exist as pages but must stay out of the sitemap: closed, filled
 * or past their validThrough. They are also noindexed and stripped of their
 * JobPosting schema in the page itself.
 */
const excludedJobPaths = expiredSlugs().map((slug) => `/jobs/${slug}`);

/** slug -> datePosted, used to stamp sitemap lastmod. */
const jobDates = new Map(
  readJobs().map(({ slug, data }) => [slug, new Date(data.datePosted)])
);

if (excludedJobPaths.length > 0) {
  console.log(
    `[sitemap] excluding ${excludedJobPaths.length} expired role(s): ${excludedJobPaths.join(', ')}`
  );
}

// https://astro.build/config
export default defineConfig({
  site: 'https://diamond-recruiters.com',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        if (path === '/thank-you') return false;
        return !excludedJobPaths.includes(path);
      },
      serialize: (item) => {
        // lastmod is the one sitemap hint Google actually acts on, so stamp
        // each job page with its posting date. changefreq/priority are
        // deliberately omitted — Google ignores them.
        const slug = new URL(item.url).pathname.replace(/\/$/, '').split('/jobs/')[1];
        const posted = slug && jobDates.get(slug);
        if (posted) {
          return { ...item, lastmod: posted.toISOString() };
        }
        return item;
      },
    }),
  ],
  build: {
    // all-inkl serves plain Apache: emit /about/index.html so URLs work without rewrites
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
  },
});
