import { ServicesView } from '@/components/ServicesView';
import { JsonLd } from '@/components/JsonLd';
import { serviceGroups } from '@/data/services';
import { breadcrumbs, jsonLd, navTitle, organizationId, pageMetadata, url } from '@/lib/seo';

const title = 'ԱՏՀ (GIS) և հիդրոլոգիական ծառայություններ';
const description =
  'ԱՏՀ (GIS) վերլուծություն և հեռահար զոնդավորում, ջրային ռեսուրսների և հիդրոլոգիական ծառայություններ, ջրհեղեղների մոդելավորում և GIS դասընթացներ Հայաստանում:';

export const metadata = pageMetadata({
  path: '/services/',
  title,
  description,
  tabTitle: navTitle('nav.services'),
  image: '/assets/img/serv_img/serv_gis.jpg',
});

/** Each service group and its subsections, so they can surface on their own. */
const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Ծառայություններ', path: '/services/' },
  ]),
  {
    '@type': 'ItemList',
    name: title,
    itemListElement: serviceGroups.map((group, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: group.title,
        description: group.cardDesc,
        image: url(group.cardImg),
        provider: { '@id': organizationId },
        areaServed: { '@type': 'Country', name: 'Armenia' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: group.title,
          itemListElement: group.subs.map((sub) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: sub.label, description: sub.desc },
          })),
        },
      },
    })),
  },
);

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={schema} />
      <ServicesView />
    </>
  );
}
