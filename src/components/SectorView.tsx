'use client';

import Link from 'next/link';
import type { Sector } from '@/data/projects';
import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './SectorView.module.css';

export function SectorView({ sector }: { sector: Sector }) {
  const { t, pick } = useLanguage();

  return (
    <section className="gg-section">
      <div className="gg-inner">
        <h1 className="gg-sr-only">{pick(sector.title, sector.titleEn)}</h1>
        <div className={styles.header}>
          <div />
          <Link href="/projects" className="gg-back">
            {t('common.back')}
          </Link>
        </div>

        {sector.items.length === 0 ? (
          <p className={styles.empty}>{t('sector.empty')}</p>
        ) : (
          <div className={styles.grid}>
            {sector.items.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${sector.key}/${project.slug}`}
                className={styles.card}
              >
                <span
                  className={styles.image}
                  style={{ backgroundImage: `url('${project.card}')` }}
                  role="img"
                  aria-label={project.title}
                />
                <span className={styles.caption}>
                  <span className={styles.title}>{project.title}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
