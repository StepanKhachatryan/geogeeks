'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import { TransitionLink } from './TransitionLink';
import styles from './Nav.module.css';

const items: { href: string; key: MessageKey }[] = [
  { href: '/tools', key: 'nav.tools' },
  { href: '/', key: 'nav.home' },
  { href: '/services', key: 'nav.services' },
  { href: '/projects', key: 'nav.projects' },
  { href: '/about', key: 'nav.about' },
  { href: '/contact', key: 'nav.contact' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Matches the `max-width: 1040px` rule in Nav.module.css. */
const MENU_BREAKPOINT = 1040;

export function Nav() {
  const pathname = usePathname();
  const { t, toggle } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);

  const close = useCallback(() => setMenuOpen(false), []);

  // The menu closes on its own links, so only outside input needs listeners.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onResize = () => {
      if (window.innerWidth > MENU_BREAKPOINT) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, close]);

  return (
    <nav ref={nav} data-nav className={styles.nav}>
      <div className={styles.inner}>
        <TransitionLink href="/" className={styles.brand} onClick={close}>
          <Image
            src="/assets/img/GeoGeeks_logo.png"
            alt="GeoGeeks"
            width={40}
            height={40}
            className={styles.logo}
            priority
          />
          <span className={styles.wordmark}>GeoGeeks</span>
        </TransitionLink>

        <div className={styles.actions}>
          <div id="gg-menu" className={`${styles.items} ${menuOpen ? styles.itemsOpen : ''}`}>
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <TransitionLink
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`${styles.item} ${item.key === 'nav.contact' ? styles.contact : ''} ${
                    active ? styles.active : ''
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(item.key)}
                </TransitionLink>
              );
            })}
          </div>

          <button type="button" onClick={toggle} className={styles.lang}>
            {t('nav.langToggle')}
          </button>

          <button
            type="button"
            className={styles.burger}
            aria-expanded={menuOpen}
            aria-controls="gg-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`${styles.burgerIcon} ${menuOpen ? styles.burgerIconOpen : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
