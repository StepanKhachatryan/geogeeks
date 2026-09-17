'use client';

import { useEffect } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Fades `[data-reveal]` elements in as they enter the viewport, staggered in
 * groups of six. Re-runs whenever `key` changes, so every page gets its own
 * pass after the router swaps the content.
 */
export function useReveal(key: string) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (elements.length === 0) return;

    const show = (el: HTMLElement) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    };

    if (prefersReducedMotion()) {
      elements.forEach(show);
      return;
    }

    elements.forEach((el, i) => {
      const delay = (i % 6) * 0.06;
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition =
        `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}s, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}s`;
    });

    if (!('IntersectionObserver' in window)) {
      elements.forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    elements.forEach((el) => observer.observe(el));

    // Failsafe: never leave content invisible if the observer never fires.
    const failsafe = window.setTimeout(() => elements.forEach(show), 2600);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [key]);
}
