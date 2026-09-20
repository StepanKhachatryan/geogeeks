import { ShpToDxfView } from '@/components/ShpToDxfView';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbs, jsonLd, navTitle, organizationId, pageMetadata, SITE_URL } from '@/lib/seo';

const title = 'Shapefile → DXF փոխարկիչ (առցանց)';
const description =
  'Վերբեռնեք shapefile-ի zip արխիվը և ստացեք DXF գծագիր՝ պոլիգոնների եզրագծերը որպես փակ գծեր։ Փոխարկումը կատարվում է ձեր դիտարկիչում, կոորդինատները չեն վերահաշվարկվում:';

export const metadata = pageMetadata({
  path: '/tools/shp-to-dxf/',
  title,
  description,
  tabTitle: navTitle('nav.tools'),
});

const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Գործիքներ', path: '/tools/' },
    { name: 'Shapefile → DXF', path: '/tools/shp-to-dxf/' },
  ]),
  {
    '@type': 'WebApplication',
    '@id': `${SITE_URL}/tools/shp-to-dxf/#app`,
    name: 'Shapefile → DXF փոխարկիչ',
    url: `${SITE_URL}/tools/shp-to-dxf/`,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web browser',
    browserRequirements: 'Requires JavaScript',
    description,
    inLanguage: 'hy-AM',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'AMD' },
    featureList: [
      'ESRI Shapefile (SHP, SHX, DBF, PRJ) zip արխիվի ընթերցում',
      'Polygon, PolygonZ, PolyLine և PolyLineZ երկրաչափություն',
      'DXF R12 արտահանում՝ POLYLINE կամ LINE օբյեկտներով',
      'Շերտեր ըստ ֆայլի անվան կամ ատրիբուտի',
      'Կոորդինատները մնում են սկզբնական համակարգում',
    ],
    publisher: { '@id': organizationId },
  },
);

export default function ShpToDxfPage() {
  return (
    <>
      <JsonLd data={schema} />
      <ShpToDxfView />
    </>
  );
}
