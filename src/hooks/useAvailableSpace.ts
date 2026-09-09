'use client';

import { useEffect, useState, type RefObject } from 'react';

export type AvailableSpace = {
  /** Viewport height left for the section once nav, footer and padding are removed. */
  height: number;
  width: number;
};

/**
 * Measures the room a full-height section has, so Services (expanded) and the
 * Projects grid can size themselves to fit without scrolling. Returns zeros
 * until the first measurement, and skips measuring while `paused` is true —
 * a re-render during a page transition restarts the curtain animation.
 */
export function useAvailableSpace(
  ref: RefObject<HTMLElement | null>,
  paused: boolean,
): AvailableSpace {
  const [space, setSpace] = useState<AvailableSpace>({ height: 0, width: 0 });

  useEffect(() => {
    if (paused) return;

    const measure = () => {
      const section = ref.current;
      if (!section) return;
      const nav = document.querySelector<HTMLElement>('[data-nav]');
      const footer = document.querySelector<HTMLElement>('[data-footer]');
      const styles = getComputedStyle(section);
      const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const height =
        window.innerHeight -
        (nav?.offsetHeight ?? 72) -
        (footer?.offsetHeight ?? 0) -
        padding -
        6;
      const next = { height: Math.max(300, Math.round(height)), width: window.innerWidth };
      setSpace((current) =>
        Math.abs(current.height - next.height) > 3 || current.width !== next.width ? next : current,
      );
    };

    const raf = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [ref, paused]);

  return space;
}
