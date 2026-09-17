import type { Metadata } from 'next';
import Script from 'next/script';
import { Noto_Sans_Armenian } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { PageFrame } from '@/components/PageFrame';
import { TransitionProvider } from '@/components/TransitionProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { JsonLd } from '@/components/JsonLd';
import { jsonLd, organizationId, organizationSchema, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

const notoSansArmenian = Noto_Sans_Armenian({
  subsets: ['armenian', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-noto-armenian',
});

const GA_ID = 'G-84V1L77P4S';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The brand alone in the tab. What the site is about is carried by the
  // description, the Open Graph title and the JSON-LD below, which is what
  // search results and shared links read anyway.
  title: {
    default: 'GeoGeeks',
    template: '%s | GeoGeeks',
  },
  description:
    'GeoGeeks-ը տրամադրում է պրոֆեսիոնալ ԱՏՀ (GIS) ծառայություններ, աշխարհագրական տվյալների վերլուծություն և վիզուալիզացիա, հիդրոլոգիական մոդելավորում և GIS կրթություն Հայաստանում: GeoGeeks provides professional GIS services, geographic data analysis and mapping, hydrological modeling, and GIS education in Armenia.',
  keywords: [
    'GeoGeeks',
    'GIS',
    'Armenia',
    'ԱՏՀ Հայաստան',
    'քարտեզագրում',
    'աշխարհագրական տվյալներ',
    'GIS analysis',
    'HEC-RAS Armenia',
    'HEC-HMS Armenia',
    'Hydrology Armenia',
    'հիդրոլոգիա',
    'հիդրավլիկա',
    'GIS կրթություն',
  ],
  authors: [{ name: 'GeoGeeks' }],
  creator: 'GeoGeeks',
  publisher: 'GeoGeeks LLC',
  icons: { icon: '/assets/img/GeoGeeks_logo.png' },
  alternates: { canonical: `${SITE_URL}/` },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Paste the token from Search Console into this variable to verify the site.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'hy_AM',
    title: 'ԱՏՀ և ջրային ռեսուրսների ծառայություններ',
    description:
      'GeoGeeks-ը մասնագիտացված է ԱՏՀ վերլուծությունների և հիդրոլոգիական, ջրային ռեսուրսներին առնչվող խնդիրների լուծման ոլորտում:',
    url: `${SITE_URL}/`,
    images: ['/assets/img/GeoGeeks_logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ԱՏՀ և ջրային ռեսուրսների ծառայություններ',
    description:
      'GeoGeeks-ը մասնագիտացված է ԱՏՀ վերլուծությունների և հիդրոլոգիական, ջրային ռեսուրսներին առնչվող խնդիրների լուծման ոլորտում:',
    images: ['/assets/img/GeoGeeks_logo.png'],
  },
};

/** Site-wide identity: the company, and the site itself for sitelinks. */
const siteSchema = jsonLd(organizationSchema, {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'hy-AM',
  publisher: { '@id': organizationId },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy" className={notoSansArmenian.variable}>
      <body>
        <LanguageProvider>
          <TransitionProvider>
            <Nav />
            <PageFrame>{children}</PageFrame>
            <Footer />
          </TransitionProvider>
        </LanguageProvider>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <JsonLd data={siteSchema} />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
