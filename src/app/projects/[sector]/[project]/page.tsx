import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectView } from '@/components/ProjectView';
import { getProject, getSector, sectors } from '@/data/projects';

type Params = { sector: string; project: string };

export function generateStaticParams(): Params[] {
  return sectors.flatMap((sector) =>
    sector.items.map((project) => ({ sector: sector.key, project: project.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { sector, project } = await params;
  const record = getProject(sector, project);
  return record ? { title: record.title, description: record.desc } : {};
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { sector: sectorKey, project: projectSlug } = await params;
  const sector = getSector(sectorKey);
  const project = getProject(sectorKey, projectSlug);
  if (!sector || !project) notFound();
  return <ProjectView sector={sector} project={project} />;
}
