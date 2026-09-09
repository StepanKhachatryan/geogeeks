'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './ContactView.module.css';

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/GeoGeeksLLC' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/73023299/' },
  { label: 'Instagram', href: 'https://www.instagram.com/geogeeksllc/' },
];

export function ContactView() {
  const { t } = useLanguage();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.cards}>
          <div data-reveal className={styles.details}>
            <div className={styles.row}>
              <span className={styles.icon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0c8495" strokeWidth="2">
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
              </span>
              <div>
                <h2 className={styles.label}>{t('contact.address')}</h2>
                <p className={styles.value}>{t('contact.addressValue')}</p>
              </div>
            </div>

            <div className={styles.row}>
              <span className={styles.icon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0c8495" strokeWidth="2">
                  <path d="M4 5c0-1 1-2 2-2h2l2 5-2 1c1 3 3 5 6 6l1-2 5 2v2c0 1-1 2-2 2C10 19 5 14 4 5z" />
                </svg>
              </span>
              <div>
                <h2 className={styles.label}>{t('contact.phone')}</h2>
                <p className={styles.value}>
                  <a href="tel:+37498098006" className={styles.plainLink}>
                    +374 (98) 09-80-06
                  </a>
                </p>
              </div>
            </div>

            <div className={`${styles.row} ${styles.lastRow}`}>
              <span className={styles.icon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0c8495" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </span>
              <div>
                <h2 className={styles.label}>{t('contact.email')}</h2>
                <p className={styles.value}>
                  <a href="mailto:geogeeksllc@gmail.com">geogeeksllc@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div data-reveal className={styles.follow}>
            <h2 className={styles.followTitle}>{t('contact.followTitle')}</h2>
            <p className={styles.followText}>{t('contact.followText')}</p>
            <div className={styles.followLinks}>
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.followLink}
                >
                  <span>{social.label}</span>
                  <span className={styles.arrow}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
