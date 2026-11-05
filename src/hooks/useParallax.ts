'use client';

import { useEffect } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Translates `[data-parallax]` elements by `scrollY × factor`, throttled to one
 * animation frame per scroll burst. Re-binds when `key` changes.
 */
export function useParallax(key: string) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const factor = parseFloat(el.dataset.parallax ?? '0') || 0;
        el.style.transform = `translate3d(0, ${(y * factor).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);
}
