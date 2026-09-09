'use client';

import { useRef } from 'react';
import { sectors } from '@/data/projects';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useAvailableSpace } from '@/hooks/useAvailableSpace';
import { TransitionLink } from './TransitionLink';
import { useTransition } from './TransitionProvider';
import styles from './ProjectsView.module.css';

const GAP = 20;
const MIN_TILE = 250;
const MIN_ROW = 120;

/**
 * All sector tiles are the same size and the grid is sized so they fit the
 * viewport without scrolling: columns come from the available width, rows from
 * the tile count, and the row height divides what is left of the height.
 */
function rowHeight(width: number, height: number, tiles: number): string {
  if (!height) return 'minmax(150px, auto)';
  const columns = Math.max(1, Math.min(4, Math.floor((width - 80 + GAP) / (MIN_TILE + GAP))));
  const rows = Math.ceil(tiles / columns);
  return `${Math.max(MIN_ROW, Math.floor((height - GAP * (rows - 1)) / rows))}px`;
}

export function ProjectsView() {
  const { t, pick } = useLanguage();
  const { transitioning } = useTransition();
  const section = useRef<HTMLElement>(null);
  const space = useAvailableSpace(section, transitioning);

  return (
    <section ref={section} className={styles.section}>
      <div className={styles.inner}>
        <div
          className={styles.grid}
          style={{ gridAutoRows: rowHeight(space.width || 1280, space.height, sectors.length) }}
        >
          {sectors.map((sector) => (
            <TransitionLink
              key={sector.key}
              href={`/projects/${sector.key}`}
              className={styles.tile}
              data-reveal
            >
              <span className={styles.tileImage} style={{ backgroundImage: `url('${sector.tile}')` }} />
              <span className={styles.tileBody}>
                <span className={styles.tileTitle}>{pick(sector.title, sector.titleEn)}</span>
                <span className={styles.tileCta}>{t('projects.view')}</span>
              </span>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
