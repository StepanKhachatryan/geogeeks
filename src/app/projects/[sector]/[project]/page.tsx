import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectView } from '@/components/ProjectView';
import { JsonLd } from '@/components/JsonLd';
import { getProject, getSector, sectors } from '@/data/projects';
import { breadcrumbs, jsonLd, organizationId, pageMetadata, url } from '@/lib/seo';

type Params = { sector: string; project: string };

export function generateStaticParams(): Params[] {
  return sectors.flatMap((sector) =>
    sector.items.map((project) => ({ sector: sector.key, project: project.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { sector, project } = await params;
  const record = getProject(sector, project);
  if (!record) return {};
  return pageMetadata({
    path: `/projects/${sector}/${project}/`,
    title: record.title,
    description: record.desc,
    image: record.img,
  });
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { sector: sectorKey, project: projectSlug } = await params;
  const sector = getSector(sectorKey);
  const project = getProject(sectorKey, projectSlug);
  if (!sector || !project) notFound();

  const schema = jsonLd(
    breadcrumbs([
      { name: 'Գլխավոր', path: '/' },
      { name: 'Նախագծեր', path: '/projects/' },
      { name: sector.title, path: `/projects/${sector.key}/` },
      { name: project.title, path: `/projects/${sector.key}/${project.slug}/` },
    ]),
    {
      '@type': 'CreativeWork',
      name: project.title,
      description: project.desc,
      image: url(project.img),
      inLanguage: 'hy-AM',
      /** The year field may be a range such as "2021 - 2024". */
      temporalCoverage: project.year,
      keywords: project.tech.join(', '),
      about: sector.title,
      creator: { '@id': organizationId },
      provider: { '@id': organizationId },
      sourceOrganization: { '@type': 'Organization', name: project.client },
    },
  );

  return (
    <>
      <JsonLd data={schema} />
      <ProjectView sector={sector} project={project} />
    </>
  );
}
