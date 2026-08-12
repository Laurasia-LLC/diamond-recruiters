import { marked } from 'marked';
import type { CollectionEntry } from 'astro:content';
import { SITE, LEGAL } from '../consts';
import { isoDate } from './format';
import { validThroughFor } from './jobStatus';

/**
 * Builds schema.org JobPosting structured data to Google's spec.
 *
 * This is what makes a role eligible for the Google Jobs box, which is where
 * most sales-engineer candidates actually search.
 *
 * Two rules that are easy to get wrong and are enforced here:
 *
 *  1. `jobLocationType: TELECOMMUTE` is ONLY valid for fully remote roles, and
 *     must NEVER be combined with `jobLocation`. Emitting both is a documented
 *     error that can invalidate the posting.
 *  2. `applicantLocationRequirements` is meaningful only for remote roles — it
 *     states where a remote worker may live. On an on-site or field role it is
 *     wrong, so it is omitted.
 *
 * Validate changes with `npm run validate:schema`, and against Google's Rich
 * Results Test once the site is reachable at a public URL.
 */
export function buildJobPostingSchema(
  job: CollectionEntry<'jobs'>,
  canonicalUrl: string
): Record<string, unknown> {
  const d = job.data;

  // Google wants the full description as HTML, not plain text.
  const description = marked.parse(job.body ?? '', { async: false }) as string;

  const schema: Record<string, unknown> = {
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
    validThrough: isoDate(validThroughFor(d)),
    employmentType: d.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE.name,
      legalName: LEGAL.entityName,
      sameAs: SITE.url,
      logo: `${SITE.url}/logo-512.png`,
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
    industry: d.sectors.join(', '),
    directApply: true,
    url: canonicalUrl,
  };

  if (d.remote) {
    // Remote form: jobLocationType + where the applicant may be based.
    // Deliberately no jobLocation — the two are mutually exclusive.
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'United States',
    };
  } else if (d.locations.length > 0) {
    schema.jobLocation = d.locations.map((loc) => ({
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: loc.city,
        addressRegion: loc.region,
        addressCountry: 'US',
      },
    }));
  } else {
    // Field-based territory with no single named city. Still an on-site role,
    // so it takes a jobLocation rather than the remote treatment.
    schema.jobLocation = [
      {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'US',
        },
        description: `Field-based territory: ${d.territoryLabel}`,
      },
    ];
  }

  return schema;
}
