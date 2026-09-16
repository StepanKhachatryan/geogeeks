import type { MetadataRoute } from 'next';
import { sectors } from '@/data/projects';

const BASE = 'https://geogeeks.am';

/** Required by `output: export`: the route is rendered once at build time. */
export const dynamic = 'force-static';

/** Generated at build time, so new sectors and projects enter the sitemap on their own. */
export default function sitemap(): MetadataRoute.Sitemap {
  // Build time: the content is static, so this is when a page last changed.
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1, changeFrequency: 'monthly', lastModified },
    { url: `${BASE}/projects/`, priority: 0.9, changeFrequency: 'monthly', lastModified },
    { url: `${BASE}/services/`, priority: 0.8, changeFrequency: 'yearly', lastModified },
    { url: `${BASE}/tools/shp-to-dxf/`, priority: 0.8, changeFrequency: 'monthly', lastModified },
    { url: `${BASE}/about/`, priority: 0.8, changeFrequency: 'yearly', lastModified },
    { url: `${BASE}/contact/`, priority: 0.5, changeFrequency: 'yearly', lastModified },
  ];

  sectors.forEach((sector) => {
    pages.push({
      url: `${BASE}/projects/${sector.key}/`,
      priority: 0.7,
      changeFrequency: 'monthly',
      lastModified,
    });
    sector.items.forEach((project) => {
      pages.push({
        url: `${BASE}/projects/${sector.key}/${project.slug}/`,
        priority: 0.6,
        changeFrequency: 'yearly',
        lastModified,
      });
    });
  });

  return pages;
}
