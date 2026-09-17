import { ProjectsView } from '@/components/ProjectsView';
import { JsonLd } from '@/components/JsonLd';
import { sectors } from '@/data/projects';
import { breadcrumbs, jsonLd, navTitle, pageMetadata, url } from '@/lib/seo';

const title = 'Նախագծեր ըստ ոլորտների';
const description =
  'GeoGeeks-ի նախագծերն ըստ ոլորտների՝ հիդրոլոգիական հետազոտություններ, ջրհեղեղների մոդելավորում, ջրային ռեսուրսների կառավարում, քաղաքաշինություն, գյուղատնտեսություն, անտառային ոլորտ և GIS կրթություն:';

export const metadata = pageMetadata({
  path: '/projects/',
  title,
  description,
  tabTitle: navTitle('nav.projects'),
  image: '/assets/img/projects_img/hydro_projects.jpg',
});

const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Նախագծեր', path: '/projects/' },
  ]),
  {
    '@type': 'ItemList',
    name: title,
    itemListElement: sectors.map((sector, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: sector.title,
      url: url(`/projects/${sector.key}/`),
    })),
  },
);

export default function ProjectsPage() {
  return (
    <>
      <JsonLd data={schema} />
      <ProjectsView />
    </>
  );
}
