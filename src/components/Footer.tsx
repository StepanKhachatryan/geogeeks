'use client';

import Image from 'next/image';
import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './Footer.module.css';

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/GeoGeeksLLC' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/73023299/' },
  { label: 'Instagram', href: 'https://www.instagram.com/geogeeksllc/' },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer data-footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image src="/assets/img/GeoGeeks_logo.png" alt="" width={30} height={30} className={styles.logo} />
          <span className={styles.copyright}>{t('footer.rights')}</span>
        </div>
        <div className={styles.socials}>
          {socials.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className={styles.social}>
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
