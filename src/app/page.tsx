import { HomeView } from '@/components/HomeView';
import { JsonLd } from '@/components/JsonLd';
import { latestProjects } from '@/data/projects';
import { jsonLd, organizationId, pageMetadata, SITE_URL, url } from '@/lib/seo';

const title = 'GeoGeeks — ԱՏՀ (GIS), հիդրոլոգիա և ջրհեղեղների մոդելավորում Հայաստանում';
const description =
  'GeoGeeks-ը տրամադրում է ԱՏՀ (GIS) ծառայություններ, հեռահար զոնդավորում, հիդրոլոգիական հետազոտություններ, ջրհեղեղների մոդելավորում և GIS դասընթացներ Հայաստանում:';

export const metadata = pageMetadata({ path: '/', title, description, absoluteTitle: true });

const schema = jsonLd({
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#webpage`,
  url: `${SITE_URL}/`,
  name: title,
  description,
  inLanguage: 'hy-AM',
  about: { '@id': organizationId },
  primaryImageOfPage: url('/assets/img/GeoGeeks_logo.png'),
  mainEntity: {
    '@type': 'ItemList',
    name: 'Վերջին նախագծեր',
    itemListElement: latestProjects().map(({ sector, project }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: project.title,
      url: url(`/projects/${sector.key}/${project.slug}/`),
    })),
  },
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={schema} />
      <HomeView />
    </>
  );
}
