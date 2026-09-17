import type { NextConfig } from 'next';

/**
 * The site is deployed as a static bundle, so the app is exported to `out/`
 * with trailing slashes (every route becomes `<route>/index.html`) and image
 * optimisation turned off — there is no Next.js server in production.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
