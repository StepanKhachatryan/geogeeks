/**
 * The browser's side of the water GIS backend.
 *
 * The site is exported as static HTML, so there is no Next.js server to proxy
 * through: these calls go straight to the Neon Function, whose URL is inlined
 * at build time from the variables `neon deploy` writes into `.env.local`.
 */

export const WATER_API = process.env.NEXT_PUBLIC_WATER_API ?? '';
export const REALTIME_URL = process.env.NEXT_PUBLIC_NEON_REALTIME_URL ?? '';

/** Both services are configured together; without them the page says so. */
export const waterConfigured = Boolean(WATER_API);
export const realtimeConfigured = Boolean(REALTIME_URL);

export type LayerKind = 'river' | 'lake' | 'canal';

export type LayerRow = {
  kind: LayerKind;
  features: number;
  updated_at: string | null;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${WATER_API}${path}`, init);
  if (!response.ok) throw new Error(`${path} -> ${response.status}`);
  return (await response.json()) as T;
}

export function health() {
  return call<{ ok: boolean; postgis: string | null }>('/health');
}

export function layers() {
  return call<{ layers: LayerRow[] }>('/layers');
}

/**
 * The sealed live query comes from the Function: the SQL behind it is never
 * exposed here, and the browser cannot change what it selects.
 */
export function sealedLayers<T>() {
  return call<T>('/live/layers', { method: 'POST' });
}

/** The tile endpoint, in the form MapLibre expects for a vector source. */
export const TILE_URL = `${WATER_API}/tiles/{z}/{x}/{y}`;
