/**
 * Every piece of company-specific data lives here. This is the one file you
 * edit to take the site live.
 *
 * Anything containing the string "PLACEHOLDER", or the digits "000+" / "XX",
 * is NOT real. `npm run check:placeholders` scans the built site and lists
 * every one still present, so nothing invented can ship by accident.
 */

import type { Locale } from './lib/locale';

export const SITE_BY_LOCALE = {
  en: {
    name: 'Diamond Recruiters',
    domain: 'diamond-recruiters.com',
    url: 'https://diamond-recruiters.com',
    tagline: 'Technical sales recruitment for industrial manufacturers',
    description:
      'Diamond Recruiters places sales engineers and technical sales leaders with industrial manufacturers across the United States. Automation, sensors, process instrumentation and flow control.',
    locale: 'en_US',
  },
  de: {
    name: 'Diamond Recruiters',
    domain: 'diamond-recruiters.de',
    url: 'https://diamond-recruiters.de',
    tagline: 'Technischer Vertrieb — Recruiting für Industriehersteller',
    description:
      'Diamond Recruiters besetzt Sales Engineers und technische Vertriebsführungskräfte bei Industrieherstellern in den USA. Automation, Prozessinstrumentierung und Flow Control.',
    locale: 'de_DE',
  },
} as const;

/** @deprecated Use SITE_BY_LOCALE[locale] in new code. */
export const SITE = SITE_BY_LOCALE.en;

export function siteFor(locale: Locale) {
  return SITE_BY_LOCALE[locale];
}

export const CONTACT = {
  applications: 'apply@diamond-recruiters.com',
  general: 'hello@diamond-recruiters.com',
  address: {
    line1: '1309 Coffeen Avenue, STE 1200',
    city: 'Sheridan',
    region: 'WY',
    postalCode: '82801',
    country: 'US',
    countryName: 'United States',
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/philipp-hoffschroer/',
  },
} as const;

/**
 * Approved website references (Philipp personally). Quotes only where sourced
 * in project testimonial files — no invented placement statistics.
 */
export const REFERENCES_EN = [
  {
    company: 'Box02 LLC',
    industry: 'E-commerce and performance marketing, Wyoming',
    contact: 'Sebastian Wolff',
    role: 'Founder & CEO',
    quote:
      'Within a short timeframe, Philipp was able to present a slate of candidates who not only matched our requirements on paper but also fit well with our culture.',
  },
  {
    company: '3V8S Ventures',
    industry: 'Mobile applications',
    contact: 'Bas van der Wals',
    role: 'Founder & CEO',
    quote:
      'As the CEO of a leading mobile app company, I had the opportunity to work closely with Philipp in recruiting our Head of AI Software Engineering.',
  },
  {
    company: 'GEF Ingenieur AG',
    industry: 'District heating, CHP and industrial energy systems',
    contact: 'Timo Che Banning',
    role: 'Authorized signatory, head of route planning',
    caseNote:
      'Our founder Philipp supports GEF Ingenieur AG with technical recruiting for project and planning engineers — including a project engineer placement from October 2025.',
  },
] as const;

export const REFERENCES_DE = [
  {
    company: 'Box02 LLC',
    industry: 'E-Commerce und Performance-Marketing, Wyoming',
    contact: 'Sebastian Wolff',
    role: 'Founder & CEO',
    quote:
      'Within a short timeframe, Philipp was able to present a slate of candidates who not only matched our requirements on paper but also fit well with our culture.',
  },
  {
    company: '3V8S Ventures',
    industry: 'Mobile Applications',
    contact: 'Bas van der Wals',
    role: 'Founder & CEO',
    quote:
      'As the CEO of a leading mobile app company, I had the opportunity to work closely with Philipp in recruiting our Head of AI Software Engineering.',
  },
  {
    company: 'GEF Ingenieur AG',
    industry: 'Fernwärme, KWK und industrielle Energiesysteme',
    contact: 'Timo Che Banning',
    role: 'Prokurist, Leiter Trassenplanung',
    caseNote:
      'Unser Gründer Philipp unterstützt die GEF Ingenieur AG beim technischen Recruiting von Projekt- und Planungsingenieuren — unter anderem mit einer Besetzung als Projektingenieur ab Oktober 2025.',
  },
] as const;

export function referencesFor(locale: Locale) {
  return locale === 'de' ? REFERENCES_DE : REFERENCES_EN;
}

export const BOOKING_BY_LOCALE = {
  en: {
    url: 'https://calendar.app.google/5xbLcjnJdEKsHMqy9',
    label: 'Book a 30-minute call with Philipp',
    note: 'Opens Google Calendar in a new tab.',
  },
  de: {
    url: 'https://calendar.app.google/5xbLcjnJdEKsHMqy9',
    label: '30-Minuten-Call mit Philipp buchen',
    note: 'Öffnet Google Kalender in einem neuen Tab.',
  },
} as const;

export const BOOKING = BOOKING_BY_LOCALE.en;

export function bookingFor(locale: Locale) {
  return BOOKING_BY_LOCALE[locale];
}

/** Exact employer-facing fee copy — do not paraphrase. */
export const FEE_TERMS = {
  en: {
    title: 'Terms agreed in writing first',
    body: 'Depending on the search, we work contingency or retained. The fee is a percentage of first-year compensation. The exact fee basis, the guarantee period and exclusivity are settled in writing before we start work. No surprises on the invoice, and nothing verbal that either side has to remember differently later.',
  },
  de: {
    title: 'Konditionen zuerst schriftlich',
    body: 'Je nach Suche arbeiten wir contingency oder retained. Das Honorar ist ein Anteil der First-year-Compensation. Die genaue Honorarbasis, die Garantiefrist und die Exklusivität halten wir schriftlich fest, bevor wir beginnen. Keine Überraschungen auf der Rechnung, und nichts nur mündlich, das später unterschiedlich erinnert wird.',
  },
} as const;

export const LEGAL = {
  entityName: 'Laurasia LLC',
  entityType: 'limited liability company',
  stateOfIncorporation: 'Wyoming',
  responsibleParty: 'Philipp Hoffschröer',
  responsibleTitle: 'Founder',
  policyLastUpdated: 'October 29, 2026',
  policyLastUpdatedDe: '29. Oktober 2026',
} as const;

export const FOUNDER_BY_LOCALE = {
  en: {
    lead: 'Philipp Hoffschröer is who employers work with at Diamond Recruiters. Briefings and hiring decisions stay with him — not a delivery queue or a separate US account team.',
  },
  de: {
    lead: 'Philipp Hoffschröer ist Ihr direkter Ansprechpartner bei Diamond Recruiters. Briefings und Einstellungsentscheidungen laufen über ihn — nicht über ein anonymes Delivery-Team.',
  },
} as const;

export const FOUNDER = {
  name: LEGAL.responsibleParty,
  title: LEGAL.responsibleTitle,
  lead: FOUNDER_BY_LOCALE.en.lead,
};

export function founderFor(locale: Locale) {
  return {
    name: LEGAL.responsibleParty,
    title: LEGAL.responsibleTitle,
    lead: FOUNDER_BY_LOCALE[locale].lead,
  };
}

export const PROOF_EN = [
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

export const PROOF_DE = [
  {
    title: 'Technischer Industrievertrieb',
    detail:
      'Suchen konzentrieren sich auf Automation, Prozessinstrumentierung und Flow Control — dort, wo der Verkauf noch von Glaubwürdigkeit auf der Anlage abhängt.',
  },
  {
    title: 'Marktkarte vor der Ansprache',
    detail:
      'Sie sehen die Unternehmen und Ansprechpartner, die wir ansprechen wollen, bevor der erste Kontakt läuft. Die Suche steht in Ihrem Markt — nicht auf einem Jobportal.',
  },
  {
    title: 'Vergütung bei ausgeschriebenen Rollen',
    detail:
      'Jede Rolle unter Offene Stellen nennt heute Basis und OTE. Vertrauliche Suchen ohne Ausschreibung klären wir im Gespräch.',
  },
] as const;

export function proofFor(locale: Locale) {
  return locale === 'de' ? PROOF_DE : PROOF_EN;
}

export const PROOF = PROOF_EN;

export const SECTORS_EN = [
  { name: 'Factory Automation', detail: 'Sensors, machine vision, industrial connectivity, safety and control components.' },
  { name: 'Process Instrumentation', detail: 'Flow, level, pressure and analytical measurement into refining and petrochem.' },
  { name: 'Flow Control & Valves', detail: 'Control valves, isolation valves, actuation and the EPC project cycle.' },
  { name: 'Robotics & Motion', detail: 'Industrial robotics, motion control, drives and the integrators around them.' },
  { name: 'Electrical & Power Distribution', detail: 'Switchgear, power quality, industrial electrical distribution.' },
  { name: 'Systems Integration', detail: 'Integrators and distribution partners who carry the line into the plant.' },
] as const;

export const SECTORS_DE = [
  { name: 'Fabrikautomation', detail: 'Sensoren, Machine Vision, industrielle Vernetzung, Safety und Steuerungskomponenten.' },
  { name: 'Prozessinstrumentierung', detail: 'Durchfluss, Füllstand, Druck und Analytik in Raffinerie und Petrochemie.' },
  { name: 'Flow Control & Armaturen', detail: 'Regelventile, Absperrarmaturen, Antriebe und der EPC-Projektzyklus.' },
  { name: 'Robotik & Antrieb', detail: 'Industrierobotik, Motion Control, Antriebe und Integratoren am Werk.' },
  { name: 'Elektrotechnik & Energieverteilung', detail: 'Schaltanlagen, Netzqualität, industrielle Energieverteilung.' },
  { name: 'Systemintegration', detail: 'Integratoren und Vertriebspartner, die die Linie ins Werk bringen.' },
] as const;

export const SECTORS = SECTORS_EN;

export function sectorsFor(locale: Locale) {
  return locale === 'de' ? SECTORS_DE : SECTORS_EN;
}

export const NAV_LINKS_EN = [
  { href: '/for-employers', label: 'For Employers' },
  { href: '/about', label: 'About' },
  { href: '/references', label: 'References' },
  { href: '/contact', label: 'Contact' },
  { href: '/jobs', label: 'Open Roles' },
  { href: '/for-candidates', label: 'For Candidates' },
] as const;

export const NAV_LINKS_DE = [
  { href: '/for-employers', label: 'Für Arbeitgeber' },
  { href: '/about', label: 'Über uns' },
  { href: '/references', label: 'Referenzen' },
  { href: '/contact', label: 'Kontakt' },
  { href: '/jobs', label: 'Offene Stellen' },
  { href: '/for-candidates', label: 'Für Kandidaten' },
] as const;

export const NAV_LINKS = NAV_LINKS_EN;

export function navFor(locale: Locale) {
  return locale === 'de' ? NAV_LINKS_DE : NAV_LINKS_EN;
}

/** Candidate apply flows may still use apply@; no server endpoint on Vercel — mailto only. */
export const APPLY_ENDPOINT = import.meta.env.PUBLIC_APPLY_ENDPOINT ?? '';

export const UPLOAD = {
  maxBytes: 8 * 1024 * 1024,
  maxLabel: '8 MB',
  accept: '.pdf,.doc,.docx',
  acceptLabel: 'PDF, DOC or DOCX',
} as const;
