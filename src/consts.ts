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
  /**
   * Applications, including the address on job ads and the imprint.
   * Change it here; the pages read this constant.
   */
  applications: 'apply@diamond-recruiters.com',

  /**
   * Imprint and privacy contact. Delivered by the catch-all on
   * @diamond-recruiters.com, which forwards to ph@skytz-consulting.com.
   * Change this one value to update both legal pages.
   */
  general: 'hello@diamond-recruiters.com',

  /** Keep `phoneHref` digits-only and E.164 — some dialers choke on punctuation. */
  phone: '+1 307 429 0181',
  phoneHref: 'tel:+13074290181',

  /** Registered address of the entity in Wyoming. */
  address: {
    line1: '1309 Coffeen Avenue, STE 1200',
    city: 'Sheridan',
    region: 'WY',
    postalCode: '82801',
    country: 'US',
    countryName: 'United States',
  },

  /** Empty entries are hidden rather than rendered as dead links. */
  social: {
    linkedin: '',
  },
} as const;

/**
 * Legal identity for the imprint and privacy policy.
 * Diamond Recruiters is a trade name of Laurasia LLC.
 *
 * No register number, EIN, or other identifier is stored here. Do not add one
 * unless the owner supplies it — the legal pages omit anything that is not set.
 *
 * The imprint and privacy contact address is CONTACT.general. The applications
 * address is CONTACT.applications. Both are edited above.
 */
export const LEGAL = {
  entityName: 'Laurasia LLC',
  /** Printed as "a Wyoming limited liability company". */
  entityType: 'limited liability company',
  stateOfIncorporation: 'Wyoming',
  /**
   * Managing person. The imprint prints "Name, Title" when responsibleTitle
   * is set, and the name alone when it is empty.
   */
  responsibleParty: 'Philipp Hoffschröer',
  responsibleTitle: 'Founder',
  /** Used in the privacy policy's "last updated" line. */
  policyLastUpdated: 'October 29, 2026',
} as const;

/**
 * What the firm commits to, in place of a metrics band. Deliberately non-numeric:
 * a new firm quoting placement counts and retention percentages invites the one
 * question it cannot answer. Each line below is a claim a client can hold us to
 * on the first engagement, which is worth more than a statistic they cannot check.
 *
 * If real figures ever exist, they belong here as a fifth item or a replacement —
 * not as decoration.
 */
export const PROOF = [
  {
    title: 'One market, not all of them',
    detail:
      'Automation, process instrumentation and flow control. A generalist agency has to be told what a control valve is before it can find someone who sells them.',
  },
  {
    title: 'The map before the approach',
    detail:
      'You see the named companies and people we intend to approach before we contact anyone. The search is grounded in your market, not a job board.',
  },
  {
    title: 'Pay ranges in the open',
    detail:
      'Every role we publish carries a base and OTE range. Candidates self-select honestly, and nobody reaches final stage to discover the band was never close.',
  },
  {
    title: 'Ninety days, not thirty',
    detail:
      'We stay in contact with both sides through the first ninety days. That is when a placement either sets or quietly comes apart.',
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
