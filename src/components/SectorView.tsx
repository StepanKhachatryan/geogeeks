'use client';

import type { Sector } from '@/data/projects';
import { useLanguage } from '@/i18n/LanguageProvider';
import { TransitionLink } from './TransitionLink';
import styles from './SectorView.module.css';

export function SectorView({ sector }: { sector: Sector }) {
  const { t } = useLanguage();

  return (
    <section className="gg-section">
      <div className="gg-inner">
        <div className={styles.header}>
          <div />
          <TransitionLink href="/projects" className="gg-back">
            {t('common.back')}
          </TransitionLink>
        </div>

        {sector.items.length === 0 ? (
          <p className={styles.empty}>{t('sector.empty')}</p>
        ) : (
          <div className={styles.grid}>
            {sector.items.map((project) => (
              <TransitionLink
                key={project.slug}
                href={`/projects/${sector.key}/${project.slug}`}
                className={styles.card}
              >
                <span className={styles.image} style={{ backgroundImage: `url('${project.card}')` }} />
                <span className={styles.caption}>
                  <span className={styles.title}>{project.title}</span>
                </span>
              </TransitionLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
