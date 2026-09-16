import { ToolsView } from '@/components/ToolsView';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbs, jsonLd, pageMetadata, url } from '@/lib/seo';

const title = 'Առցանց ԱՏՀ գործիքներ';
const description =
  'GeoGeeks-ի անվճար առցանց գործիքները՝ shapefile-ից DXF փոխարկում ուղիղ դիտարկիչում, առանց ֆայլերը սերվեր ուղարկելու:';

export const metadata = pageMetadata({ path: '/tools/', title, description });

const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Գործիքներ', path: '/tools/' },
  ]),
  {
    '@type': 'ItemList',
    name: title,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Shapefile → DXF փոխարկիչ',
        url: url('/tools/shp-to-dxf/'),
      },
    ],
  },
);

export default function ToolsPage() {
  return (
    <>
      <JsonLd data={schema} />
      <ToolsView />
    </>
  );
}
