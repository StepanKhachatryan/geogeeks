import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectorView } from '@/components/SectorView';
import { JsonLd } from '@/components/JsonLd';
import { getSector, sectors, type Sector } from '@/data/projects';
import { breadcrumbs, jsonLd, pageMetadata, url } from '@/lib/seo';

type Params = { sector: string };

export function generateStaticParams(): Params[] {
  return sectors.map((sector) => ({ sector: sector.key }));
}

/** Built from the sector's own projects, so every sector page reads differently. */
function describe(sector: Sector): string {
  if (sector.items.length === 0) {
    return `${sector.title} — GeoGeeks-ի ոլորտային էջ։ Այս ոլորտում դեռ հրապարակված նախագիծ չկա:`;
  }
  return `${sector.title} — GeoGeeks-ի նախագծերը. ${sector.items.map((p) => p.title).join('; ')}։`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const sector = getSector((await params).sector);
  if (!sector) return {};
  return pageMetadata({
    path: `/projects/${sector.key}/`,
    title: sector.title,
    description: describe(sector),
    image: sector.tile,
  });
}

export default async function SectorPage({ params }: { params: Promise<Params> }) {
  const sector = getSector((await params).sector);
  if (!sector) notFound();

  const schema = jsonLd(
    breadcrumbs([
      { name: 'Գլխավոր', path: '/' },
      { name: 'Նախագծեր', path: '/projects/' },
      { name: sector.title, path: `/projects/${sector.key}/` },
    ]),
    {
      '@type': 'CollectionPage',
      name: sector.title,
      description: describe(sector),
      hasPart: sector.items.map((project) => ({
        '@type': 'CreativeWork',
        name: project.title,
        url: url(`/projects/${sector.key}/${project.slug}/`),
      })),
    },
  );

  return (
    <>
      <JsonLd data={schema} />
      <SectorView sector={sector} />
    </>
  );
}
