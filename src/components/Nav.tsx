'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import styles from './Nav.module.css';

type NavLink = { href: string; key: MessageKey; external?: boolean };
type NavEntry = NavLink | { key: MessageKey; match: string; children: NavLink[] };

const items: NavEntry[] = [
  { href: '/', key: 'nav.home' },
  // Two tools now, and one of them is a site of its own, so the entry opens a
  // list rather than going straight to the converter.
  {
    key: 'nav.tools',
    match: '/tools',
    children: [
      { href: '/tools/shp-to-dxf', key: 'nav.toolConverter' },
      { href: 'https://wmpa.geogeeks.am', key: 'nav.toolMap', external: true },
    ],
  },
  { href: '/services', key: 'nav.services' },
  { href: '/projects', key: 'nav.projects' },
  { href: '/about', key: 'nav.about' },
  { href: '/contact', key: 'nav.contact' },
];

const hasChildren = (entry: NavEntry): entry is Extract<NavEntry, { children: NavLink[] }> =>
  'children' in entry;

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
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setMenuOpen(false);
    setOpenGroup(null);
  }, []);

  // The menu closes on its own links, so only outside input needs listeners.
  useEffect(() => {
    if (!menuOpen && !openGroup) return;
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
  }, [menuOpen, openGroup, close]);

  return (
    <nav ref={nav} data-nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={close}>
          <Image
            src="/assets/img/GeoGeeks_logo.png"
            alt="GeoGeeks"
            width={40}
            height={40}
            className={styles.logo}
            priority
          />
          <span className={styles.wordmark}>GeoGeeks</span>
        </Link>

        <div className={styles.actions}>
          <div id="gg-menu" className={`${styles.items} ${menuOpen ? styles.itemsOpen : ''}`}>
            {items.map((entry) => {
              if (hasChildren(entry)) {
                const active = isActive(pathname, entry.match);
                const open = openGroup === entry.key;
                return (
                  <div key={entry.key} className={styles.group}>
                    <button
                      type="button"
                      className={`${styles.item} ${styles.groupButton} ${
                        active ? styles.active : ''
                      }`}
                      aria-expanded={open}
                      aria-controls={`gg-group-${entry.key}`}
                      onClick={() => setOpenGroup(open ? null : entry.key)}
                    >
                      {t(entry.key)}
                      <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`} />
                    </button>

                    <div
                      id={`gg-group-${entry.key}`}
                      className={`${styles.submenu} ${open ? styles.submenuOpen : ''}`}
                    >
                      {entry.children.map((child) =>
                        child.external ? (
                          <a
                            key={child.href}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={close}
                            className={styles.subitem}
                          >
                            {t(child.key)}
                            <span className={styles.outward} aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={close}
                            className={`${styles.subitem} ${
                              isActive(pathname, child.href) ? styles.subitemActive : ''
                            }`}
                            aria-current={isActive(pathname, child.href) ? 'page' : undefined}
                          >
                            {t(child.key)}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                );
              }

              const active = isActive(pathname, entry.href);
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={close}
                  className={`${styles.item} ${entry.key === 'nav.contact' ? styles.contact : ''} ${
                    active ? styles.active : ''
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(entry.key)}
                </Link>
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
