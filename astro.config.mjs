// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { expiredSlugs, readJobs } from './scripts/lib/jobIndex.mjs';

const excludedJobPaths = expiredSlugs().map((slug) => `/jobs/${slug}`);
const excludedJobPathsDe = excludedJobPaths.map((p) => `/de${p}`);

const jobDates = new Map(
  readJobs().map(({ slug, data }) => [slug, new Date(data.datePosted)])
);

const allExcluded = [...excludedJobPaths, ...excludedJobPathsDe, '/de/thank-you'];

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
        return !allExcluded.includes(path);
      },
      serialize: (item) => {
        const url = new URL(item.url);
        let pathname = url.pathname.replace(/\/$/, '') || '/';

        if (pathname.startsWith('/de')) {
          const publicPath = pathname.replace(/^\/de/, '') || '/';
          return {
            ...item,
            url: `https://diamond-recruiters.de${publicPath}`,
          };
        }

        const slug = pathname.split('/jobs/')[1];
        const posted = slug && jobDates.get(slug);
        if (posted) {
          return { ...item, lastmod: posted.toISOString() };
        }
        return item;
      },
    }),
  ],
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    responsiveStyles: true,
  },
});
