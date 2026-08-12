import { marked } from 'marked';
import type { CollectionEntry } from 'astro:content';
import { SITE, LEGAL } from '../consts';
import { isoDate } from './format';

/**
 * Builds schema.org JobPosting structured data.
 *
 * This is what makes a role eligible to appear in the Google Jobs box, which
 * is where most sales-engineer candidates actually search. Validate changes at
 * https://search.google.com/test/rich-results before shipping.
 */
export function buildJobPostingSchema(
  job: CollectionEntry<'jobs'>,
  canonicalUrl: string
): Record<string, unknown> {
  const d = job.data;

  // Google wants the full description as HTML, not plain text.
  const description = marked.parse(job.body ?? '', { async: false }) as string;

  const jobLocation =
    d.locations.length > 0
      ? d.locations.map((loc) => ({
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: loc.city,
            addressRegion: loc.region,
            addressCountry: 'US',
          },
        }))
      : [
          {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'US',
            },
            description: `Field-based territory: ${d.territoryLabel}`,
          },
        ];

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: d.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: SITE.name,
      value: job.id,
    },
    datePosted: isoDate(d.datePosted),
    validThrough: isoDate(d.validThrough),
    employmentType: d.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE.name,
      legalName: LEGAL.entityName,
      sameAs: SITE.url,
      logo: `${SITE.url}/logo-512.png`,
    },
    jobLocation,
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'United States',
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: d.baseMin,
        maxValue: d.baseMax,
        unitText: 'YEAR',
      },
    },
    estimatedSalary: {
      '@type': 'MonetaryAmountDistribution',
      name: 'On-target earnings',
      currency: 'USD',
      minValue: d.oteMin,
      maxValue: d.oteMax,
      unitText: 'YEAR',
    },
    industry: d.sectors.join(', '),
    directApply: true,
    url: canonicalUrl,
  };
}
