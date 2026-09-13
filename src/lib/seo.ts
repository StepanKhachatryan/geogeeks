import type { Metadata } from 'next';

export const SITE_URL = 'https://geogeeks.am';
export const SITE_NAME = 'GeoGeeks';

/** Paths carry a trailing slash to match the exported URLs exactly. */
export function url(path: string): string {
  return new URL(path, SITE_URL).toString();
}

type PageSeo = {
  /** Route path with a trailing slash, e.g. `/services/`. */
  path: string;
  title: string;
  description: string;
  /** Absolute or site-relative image; defaults to the logo. */
  image?: string;
  /** Skips the "%s | GeoGeeks" template, for a title that already names the site. */
  absoluteTitle?: boolean;
};

const DEFAULT_IMAGE = '/assets/img/GeoGeeks_logo.png';

/** Search results cut a description around 160 characters; cut it on a word. */
export function trim(text: string, limit = 160): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('՝'), cut.lastIndexOf(';'));
  return `${cut.slice(0, stop > limit * 0.6 ? stop : limit).trimEnd()}…`;
}

/**
 * Per-page canonical, Open Graph and Twitter tags. Without this every page
 * inherits the home page's social card and has no canonical URL of its own.
 */
export function pageMetadata({
  path,
  title,
  description,
  image,
  absoluteTitle,
}: PageSeo): Metadata {
  const canonical = url(path);
  const social = url(image ?? DEFAULT_IMAGE);
  const summary = trim(description);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: summary,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'hy_AM',
      url: canonical,
      title,
      description: summary,
      images: [{ url: social, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      images: [social],
    },
  };
}

export const organizationId = `${SITE_URL}/#organization`;

/** The company itself: referenced by every other block through its @id. */
export const organizationSchema = {
  '@type': ['Organization', 'ProfessionalService'],
  '@id': organizationId,
  name: SITE_NAME,
  legalName: 'GeoGeeks LLC',
  url: `${SITE_URL}/`,
  logo: url(DEFAULT_IMAGE),
  image: url(DEFAULT_IMAGE),
  foundingDate: '2021',
  description:
    'GeoGeeks-ը մատուցում է ԱՏՀ (GIS) վերլուծության, հեռահար զոնդավորման, հիդրոլոգիական հետազոտության, ջրհեղեղների մոդելավորման և GIS կրթության ծառայություններ Հայաստանում:',
  email: 'geogeeksllc@gmail.com',
  telephone: '+374-98-09-80-06',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Ադոնց 4/3',
    addressLocality: 'Երևան',
    addressCountry: 'AM',
  },
  areaServed: { '@type': 'Country', name: 'Armenia' },
  knowsLanguage: ['hy', 'en'],
  sameAs: [
    'https://www.facebook.com/GeoGeeksLLC',
    'https://www.linkedin.com/company/73023299/',
    'https://www.instagram.com/geogeeksllc/',
  ],
};

/** Wraps blocks in a single @graph so one script tag carries the whole page. */
export function jsonLd(...blocks: object[]): string {
  // Escaping `<` keeps a stray "</script>" in any field from closing the tag.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': blocks }).replace(
    /</g,
    '\\u003c',
  );
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: url(step.path),
    })),
  };
}
