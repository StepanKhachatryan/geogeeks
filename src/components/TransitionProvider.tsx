'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { curtainColors, motion } from '@/lib/tokens';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

type TransitionValue = {
  /** Runs the curtain, swaps the route while covered, then releases the lock. */
  navigate: (href: string) => void;
  transitioning: boolean;
};

const TransitionContext = createContext<TransitionValue | null>(null);

const normalize = (href: string) => (href.length > 1 ? href.replace(/\/+$/, '') : href);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const locked = useRef(false);
  const host = useRef<HTMLDivElement | null>(null);

  /**
   * The curtain lives outside the React tree on purpose: a re-render during the
   * transition would restart the bar animations mid-flight.
   */
  const runCurtain = useCallback(() => {
    let element = host.current;
    if (!element || !element.isConnected) {
      element = document.createElement('div');
      element.setAttribute(
        'style',
        'position:fixed; inset:0; z-index:3000; pointer-events:none; display:flex;',
      );
      curtainColors.forEach((background) => {
        const bar = document.createElement('div');
        bar.setAttribute('style', `flex:1; background:${background}; transform:translateY(101%);`);
        element!.appendChild(bar);
      });
      document.body.appendChild(element);
      host.current = element;
    }
    Array.from(element.children).forEach((node, i) => {
      const bar = node as HTMLElement;
      const duration = 0.85 + (i % 3) * 0.12 + (i % 2) * 0.08;
      bar.style.animation = 'none';
      void bar.offsetWidth; // force a reflow so the animation restarts
      bar.style.animation =
        `gg-curtain ${duration.toFixed(2)}s ${motion.curtainEase} ${(i * 0.045).toFixed(3)}s forwards`;
    });
  }, []);

  const navigate = useCallback(
    (href: string) => {
      if (locked.current || normalize(href) === normalize(pathname)) return;
      if (prefersReducedMotion()) {
        router.push(href);
        window.scrollTo(0, 0);
        return;
      }
      locked.current = true;
      setTransitioning(true);
      runCurtain();
      window.setTimeout(() => {
        router.push(href);
        window.scrollTo(0, 0);
      }, motion.swapDelay);
      window.setTimeout(() => {
        locked.current = false;
        setTransitioning(false);
      }, motion.lockDuration);
    },
    [pathname, router, runCurtain],
  );

  // Back/forward swaps the content itself, so the curtain runs over the result.
  useEffect(() => {
    const onPopState = () => {
      if (!prefersReducedMotion()) runCurtain();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [runCurtain]);

  useEffect(
    () => () => {
      if (host.current?.isConnected) host.current.remove();
    },
    [],
  );

  const value = useMemo(() => ({ navigate, transitioning }), [navigate, transitioning]);
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function useTransition(): TransitionValue {
  const value = useContext(TransitionContext);
  if (!value) throw new Error('useTransition must be used inside TransitionProvider');
  return value;
}
