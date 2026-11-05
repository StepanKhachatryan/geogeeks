'use client';

import { usePathname } from 'next/navigation';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import styles from './PageFrame.module.css';

/**
 * Wraps the routed content. The pathname key remounts the wrapper on every page
 * change, which replays the page-in animation and re-arms the reveal observer.
 */
export function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useReveal(pathname);
  useParallax(pathname);

  return (
    <main key={pathname} className={styles.page}>
      {children}
    </main>
  );
}
