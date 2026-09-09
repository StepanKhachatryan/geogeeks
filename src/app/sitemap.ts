import type { MetadataRoute } from 'next';
import { sectors } from '@/data/projects';

const BASE = 'https://geogeeks.am';

/** Required by `output: export`: the route is rendered once at build time. */
export const dynamic = 'force-static';

/** Generated at build time, so new sectors and projects enter the sitemap on their own. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/projects/`, priority: 0.9 },
    { url: `${BASE}/services/`, priority: 0.8 },
    { url: `${BASE}/about/`, priority: 0.8 },
    { url: `${BASE}/contact/`, priority: 0.5 },
  ];

  sectors.forEach((sector) => {
    pages.push({ url: `${BASE}/projects/${sector.key}/`, priority: 0.7 });
    sector.items.forEach((project) => {
      pages.push({ url: `${BASE}/projects/${sector.key}/${project.slug}/`, priority: 0.6 });
    });
  });

  return pages;
}
