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
  /**
   * The Neon service URLs are written into `.env.local` by `neon deploy` under
   * their own names. A static export has no server to read them at request
   * time, so they are inlined into the browser bundle here rather than
   * duplicated by hand into NEXT_PUBLIC_ copies.
   */
  env: {
    NEXT_PUBLIC_WATER_API: process.env.NEON_FUNCTION_WATER_BASE_URL ?? '',
    NEXT_PUBLIC_NEON_REALTIME_URL: process.env.NEON_REALTIME_URL ?? '',
  },
};

export default nextConfig;
