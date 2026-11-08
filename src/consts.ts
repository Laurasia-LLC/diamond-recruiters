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
   * Imprint and privacy contact, and the address every employer-facing page
   * prints. Delivered by the catch-all on @diamond-recruiters.com, which
   * forwards to ph@skytz-consulting.com. Change this one value to update both
   * legal pages and the employer CTA.
   */
  general: 'hello@diamond-recruiters.com',

  /**
   * Keep `phoneHref` digits-only and E.164 — some dialers choke on punctuation.
   * Listed publicly on skytz-consulting.com; hidden from marketing UI until routing
   * is confirmed (see PREVIEW_BLOCKERS.md). Imprint uses email-only contact for now.
   */
  phone: '+1 307 429 0181',
  phoneHref: 'tel:+13074290181',
  showPhoneInUI: false,

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
    linkedin: 'https://www.linkedin.com/in/philipp-hoffschroer/',
  },
} as const;

/**
 * Signed reference letters published on skytz-consulting.com with permission.
 * Quotes are reproduced exactly from that public source. They describe Philipp
 * Hoffschröer's recruitment work for the named companies — not outcomes
 * claimed for Diamond Recruiters in the United States unless stated here.
 */
export const REFERENCES_ATTRIBUTION = {
  title: 'Context',
  body:
    'These excerpts come from signed letters published on skytz-consulting.com with permission. Wording, names and roles match that site. They describe earlier recruitment work, not US results claimed for Diamond.',
  sourceLabel: 'skytz-consulting.com',
  sourceUrl: 'https://skytz-consulting.com/en',
} as const;

export const REFERENCES = [
  {
    company: 'Megger Germany GmbH',
    industry: 'Electrical test and measurement equipment',
    relationship: 'Client since 2016',
    contact: 'Friedrich Enkert',
    role: 'VP Global Sales CI, Managing Director Megger Germany GmbH',
    quote:
      'He has an impressive track record, successfully recruiting multiple qualified candidates for key positions in our company. His professionalism, deep understanding of our specific needs, and his ability to identify the best talents in the market have significantly contributed to our company\'s success.',
  },
  {
    company: 'SebaKMT by Megger',
    industry: 'Cable fault location and pipeline leak detection',
    contact: 'Sascha Kuflik',
    role: 'Business Unit Director at the time',
    quote:
      'I first had the opportunity to know Philipp from the perspective of a candidate. Subsequently, as a Business Unit Leader at SebaKMT, I engaged Philipp\'s services as an external recruiter. From this dual perspective, I can attest to the fact that Philipp consistently delivers outstanding results.',
  },
  {
    company: 'Eurasia Group AG',
    industry: 'Agriculture and financial holding, Switzerland',
    relationship: 'CFO search',
    contact: 'Mustafa Sahin',
    role: 'Chief Executive Officer',
    quote:
      'He was responsible for the search, pre-selection, and candidate outreach, and supported the process through to the successful appointment of our Chief Financial Officer. The candidates presented were well targeted and professionally pre-qualified. The final placement fully met our expectations.',
  },
  {
    company: 'SWR · Südwestdeutsche Rohrleitungsbau GmbH',
    industry: 'Pipeline and district heating construction, Frankfurt',
    contact: 'Dirk Heesen',
    role: 'Managing Director',
    quote:
      'What sets him apart is his meticulous selection of candidates who not only possess the required skills but also align well with our corporate culture.',
  },
] as const;

/**
 * Public scheduling link for employer conversations.
 *
 * It is a plain outbound link, not an embed: nothing is requested from Google
 * until the visitor chooses to follow it, so the site keeps its no-third-party
 * assets and no-tracking position. The calendar owns the call length and the
 * available slots, so neither is stated here.
 */
export const BOOKING = {
  url: 'https://calendar.app.google/5xbLcjnJdEKsHMqy9',
  label: 'Book a call',
  note: 'Opens Google Calendar in a new tab.',
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
 * Founder-facing facts for HumanContact and JSON-LD. Photo is self-hosted
 * (reproduced from skytz-consulting.com with permission — see CREDITS.md).
 */
export const FOUNDER = {
  name: LEGAL.responsibleParty,
  title: LEGAL.responsibleTitle,
  /**
   * Short positioning line. Longer biography belongs on About and References,
   * not repeated on every contact block.
   */
  lead:
    'Philipp Hoffschröer is the direct contact for employer enquiries at Diamond Recruiters. Briefings and decisions stay with him; identification and outreach may use research tools and assistants.',
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
    title: 'Industrial technical sales',
    detail:
      'Searches focus on automation, process instrumentation and flow control — the product lines where the sale still depends on plant-floor credibility.',
  },
  {
    title: 'The map before the approach',
    detail:
      'You see the named companies and people we intend to approach before we contact anyone. The search is grounded in your market, not a job board.',
  },
  {
    title: 'Compensation on posted roles',
    detail:
      'Each role under Open roles includes base and OTE ranges in the listing today. Confidential searches that are not posted are agreed in conversation.',
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
  { href: '/references', label: 'References' },
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
