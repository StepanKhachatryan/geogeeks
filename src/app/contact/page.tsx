import { ContactView } from '@/components/ContactView';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbs, jsonLd, navTitle, organizationId, pageMetadata, SITE_URL } from '@/lib/seo';

const title = 'Կապ';
const description =
  'Կապ GeoGeeks-ի հետ՝ Ադոնց 4/3, Երևան, Հայաստան։ Հեռախոս +374 (98) 09-80-06, էլ. փոստ geogeeksllc@gmail.com';

export const metadata = pageMetadata({
  path: '/contact/',
  title,
  description,
  tabTitle: navTitle('nav.contact'),
});

const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Կապ', path: '/contact/' },
  ]),
  {
    '@type': 'ContactPage',
    '@id': `${SITE_URL}/contact/#page`,
    name: title,
    description,
    mainEntity: { '@id': organizationId },
  },
  {
    '@id': organizationId,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: '+374-98-09-80-06',
        email: 'geogeeksllc@gmail.com',
        availableLanguage: ['hy', 'en'],
      },
    ],
  },
);

export default function ContactPage() {
  return (
    <>
      <JsonLd data={schema} />
      <ContactView />
    </>
  );
}
