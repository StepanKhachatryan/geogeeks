import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectorView } from '@/components/SectorView';
import { getSector, sectors } from '@/data/projects';

type Params = { sector: string };

export function generateStaticParams(): Params[] {
  return sectors.map((sector) => ({ sector: sector.key }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const sector = getSector((await params).sector);
  return sector ? { title: sector.title } : {};
}

export default async function SectorPage({ params }: { params: Promise<Params> }) {
  const sector = getSector((await params).sector);
  if (!sector) notFound();
  return <SectorView sector={sector} />;
}
