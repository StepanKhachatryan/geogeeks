import type { Metadata } from 'next';
import Script from 'next/script';
import { Noto_Sans_Armenian } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { PageFrame } from '@/components/PageFrame';
import { TransitionProvider } from '@/components/TransitionProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import './globals.css';

const notoSansArmenian = Noto_Sans_Armenian({
  subsets: ['armenian', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-noto-armenian',
});

const GA_ID = 'G-84V1L77P4S';

export const metadata: Metadata = {
  metadataBase: new URL('https://geogeeks.am'),
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
  icons: { icon: '/assets/img/GeoGeeks_logo.png' },
  openGraph: {
    title: 'ԱՏՀ և ջրային ռեսուրսների ծառայություններ',
    description:
      'GeoGeeks-ը մասնագիտացված է ԱՏՀ վերլուծությունների և հիդրոլոգիական, ջրային ռեսուրսներին առնչվող խնդիրների լուծման ոլորտում:',
    url: 'https://geogeeks.am',
    images: ['/assets/img/GeoGeeks_logo.png'],
    type: 'website',
  },
};

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
