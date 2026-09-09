import type { Lang } from './messages';

const STORAGE_KEY = 'geogeeks-lang';

/**
 * The chosen language lives outside React so it can be read with
 * `useSyncExternalStore`: the server and the hydration pass see Armenian, and
 * the stored preference is applied on the first client render after that.
 */
let current: Lang | null = null;
const listeners = new Set<() => void>();

export function getLang(): Lang {
  if (current) return current;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    current = stored === 'en' || stored === 'hy' ? stored : 'hy';
  } catch {
    current = 'hy';
  }
  return current;
}

/** Armenian is the prerendered default. */
export function getServerLang(): Lang {
  return 'hy';
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleLang(): void {
  const next: Lang = getLang() === 'hy' ? 'en' : 'hy';
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // A blocked storage does not stop the toggle from working for this visit.
  }
  listeners.forEach((listener) => listener());
}
