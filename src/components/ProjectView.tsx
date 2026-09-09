'use client';

import type { Project, Sector } from '@/data/projects';
import { useLanguage } from '@/i18n/LanguageProvider';
import { TransitionLink } from './TransitionLink';
import styles from './ProjectView.module.css';

export function ProjectView({ sector, project }: { sector: Sector; project: Project }) {
  const { t, pick } = useLanguage();

  return (
    <section className="gg-section">
      <div className="gg-inner">
        <div className="gg-page-header">
          <div className="gg-kicker">{pick(sector.title, sector.titleEn)}</div>
          <TransitionLink href={`/projects/${sector.key}`} className="gg-back">
            {t('common.back')}
          </TransitionLink>
        </div>

        <div className={styles.layout}>
          <div
            data-reveal
            className={styles.image}
            style={{ backgroundImage: `url('${project.img}')` }}
            role="img"
            aria-label={project.title}
          />
          <div data-reveal>
            <h1 className={styles.title}>{project.title}</h1>
            <div className={styles.client}>
              {t('project.client')}
              {project.client}
            </div>
            <div className={styles.meta}>
              <div>
                <span className={styles.metaLabel}>{t('project.year')}</span>
                <p className={styles.metaValue}>{project.year}</p>
              </div>
              <div>
                <span className={styles.metaLabel}>{t('project.duration')}</span>
                <p className={styles.metaValue}>{project.duration}</p>
              </div>
            </div>
            <p className={styles.desc}>{project.desc}</p>
            <div className={styles.tech}>
              {project.tech.map((name) => (
                <span key={name} className={styles.tag}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
