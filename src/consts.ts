/**
 * Every piece of company-specific data lives here. This is the one file you
 * edit to take the site live.
 *
 * Anything containing the string "PLACEHOLDER", or the digits "000+" / "XX",
 * is NOT real. `npm run check:placeholders` scans the built site and lists
 * every one still present, so nothing invented can ship by accident.
 */

export const SITE = {
  name: 'Diamond Recruiters',
  domain: 'diamond-recruiters.com',
  url: 'https://diamond-recruiters.com',
  tagline: 'Technical sales recruitment for industrial manufacturers',
  description:
    'Diamond Recruiters places sales engineers and technical sales leaders with industrial manufacturers across the United States. Automation, sensors, process instrumentation and flow control.',
  locale: 'en_US',
} as const;

export const CONTACT = {
  /** Real, and printed in both job ads. Applications land here. */
  applications: 'apply@diamond-recruiters.com',

  /** PLACEHOLDER — create this mailbox in all-inkl KAS, or change it to apply@. */
  general: 'hello@diamond-recruiters.com',

  /** PLACEHOLDER — replace with the real number, or delete and I'll drop phone UI. */
  phone: '+1 (000) 000-0000',
  phoneHref: 'tel:+10000000000',

  /** PLACEHOLDER — replace with the registered business address. */
  address: {
    line1: '000 PLACEHOLDER Street, Suite 000',
    city: 'PLACEHOLDER City',
    region: 'ST',
    postalCode: '00000',
    country: 'US',
    countryName: 'United States',
  },

  /** PLACEHOLDER — remove any line you don't have; the footer hides empty ones. */
  social: {
    linkedin: 'https://www.linkedin.com/company/PLACEHOLDER',
  },
} as const;

/**
 * PLACEHOLDER — legal identity for the Imprint and Privacy pages.
 * A US entity: exact registered name, state of incorporation, and the
 * person accountable for the site's content.
 */
export const LEGAL = {
  entityName: 'PLACEHOLDER Diamond Recruiters LLC',
  entityType: 'Limited Liability Company',
  stateOfIncorporation: 'PLACEHOLDER State',
  responsibleParty: 'PLACEHOLDER Full Name',
  responsibleTitle: 'Managing Partner',
  /** Used in the privacy policy's "last updated" line. */
  policyLastUpdated: 'August 12, 2026',
} as const;

/**
 * PLACEHOLDER STATS — every number below is fake and must be replaced or removed.
 * They are rendered in an obviously-unreal form so they cannot pass a glance.
 */
export const STATS = [
  {
    value: '000+',
    label: 'Placements made',
    detail: 'Sales engineers and technical sales leaders placed since inception.',
  },
  {
    value: 'XX',
    label: 'Years in the field',
    detail: 'Recruiting exclusively inside industrial and process manufacturing.',
  },
  {
    value: '00',
    label: 'Days to shortlist',
    detail: 'Median time from kickoff call to a qualified slate in front of you.',
  },
  {
    value: '00%',
    label: 'Retention at 12 months',
    detail: 'Placed candidates still in seat one year after their start date.',
  },
] as const;

/** The markets Diamond actually recruits into. Drawn from the live searches. */
export const SECTORS = [
  {
    name: 'Factory Automation',
    detail: 'Sensors, machine vision, industrial connectivity, safety and control components.',
  },
  {
    name: 'Process Instrumentation',
    detail: 'Flow, level, pressure and analytical measurement into refining and petrochem.',
  },
  {
    name: 'Flow Control & Valves',
    detail: 'Control valves, isolation valves, actuation and the EPC project cycle.',
  },
  {
    name: 'Robotics & Motion',
    detail: 'Industrial robotics, motion control, drives and the integrators around them.',
  },
  {
    name: 'Electrical & Power Distribution',
    detail: 'Switchgear, power quality, industrial electrical distribution.',
  },
  {
    name: 'Systems Integration',
    detail: 'Integrators and distribution partners who carry the line into the plant.',
  },
] as const;

export const NAV_LINKS = [
  { href: '/jobs', label: 'Open Roles' },
  { href: '/for-employers', label: 'For Employers' },
  { href: '/for-candidates', label: 'For Candidates' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * Where the application form POSTs. Overridable with PUBLIC_APPLY_ENDPOINT so
 * the PHP handler can be swapped for a serverless function later without
 * touching any component — see README "Moving off all-inkl".
 */
export const APPLY_ENDPOINT =
  import.meta.env.PUBLIC_APPLY_ENDPOINT ?? '/api/apply.php';

/** Mirrors the server-side limits in public/api/apply.php. Keep in sync. */
export const UPLOAD = {
  maxBytes: 8 * 1024 * 1024,
  maxLabel: '8 MB',
  accept: '.pdf,.doc,.docx',
  acceptLabel: 'PDF, DOC or DOCX',
} as const;
