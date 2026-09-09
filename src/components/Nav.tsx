'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import { TransitionLink } from './TransitionLink';
import styles from './Nav.module.css';

const items: { href: string; key: MessageKey }[] = [
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

export function Nav() {
  const pathname = usePathname();
  const { t, toggle } = useLanguage();

  return (
    <nav data-nav className={styles.nav}>
      <div className={styles.inner}>
        <TransitionLink href="/" className={styles.brand}>
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

        <div className={styles.items}>
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                className={`${styles.item} ${item.key === 'nav.contact' ? styles.contact : ''} ${
                  active ? styles.active : ''
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {t(item.key)}
              </TransitionLink>
            );
          })}
          <button type="button" onClick={toggle} className={styles.lang}>
            {t('nav.langToggle')}
          </button>
        </div>
      </div>
    </nav>
  );
}
