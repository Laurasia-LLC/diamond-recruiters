export type Locale = 'en' | 'de';

export const LOCALES: Record<
  Locale,
  {
    lang: string;
    htmlLang: string;
    host: string;
    origin: string;
    pathPrefix: string;
    ogLocale: string;
  }
> = {
  en: {
    lang: 'en',
    htmlLang: 'en-US',
    host: 'diamond-recruiters.com',
    origin: 'https://diamond-recruiters.com',
    pathPrefix: '',
    ogLocale: 'en_US',
  },
  de: {
    lang: 'de',
    htmlLang: 'de-DE',
    host: 'diamond-recruiters.de',
    origin: 'https://diamond-recruiters.de',
    pathPrefix: '/de',
    ogLocale: 'de_DE',
  },
};

/** Strip locale prefix from the built page path (e.g. `/de/about` → `/about`). */
export function logicalPath(pathname: string): string {
  const bare = pathname.replace(/\/+$/, '') || '/';
  if (bare === '/de') return '/';
  if (bare.startsWith('/de/')) return bare.slice(3) || '/';
  return bare;
}

/** Filesystem / router path for a locale and logical route. */
export function localePath(locale: Locale, logical: string): string {
  const clean = logical === '/' ? '' : logical.replace(/\/+$/, '');
  const prefix = LOCALES[locale].pathPrefix;
  return `${prefix}${clean || ''}` || '/';
}

/** Public canonical URL on the correct host (no `/de` prefix on .de). */
export function canonicalFor(locale: Locale, logical: string): string {
  const origin = LOCALES[locale].origin;
  const path = logical === '/' ? '' : logical.replace(/\/+$/, '');
  return `${origin}${path}`;
}

/** Hreflang alternate URL on the paired domain. */
export function alternateFor(locale: Locale, logical: string): string {
  const other: Locale = locale === 'en' ? 'de' : 'en';
  return canonicalFor(other, logical);
}

export function detectLocaleFromPath(pathname: string): Locale {
  return pathname === '/de' || pathname.startsWith('/de/') ? 'de' : 'en';
}
