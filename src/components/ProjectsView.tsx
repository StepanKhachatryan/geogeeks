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
const MAX_CONTENT = 2200;

/**
 * All sector tiles are the same size and the grid fits the viewport without
 * scrolling. The width decides how many tiles could sit in a row; the count is
 * then evened out over the rows they need, so a wide screen shows 4 and 4
 * rather than 6 and 2. The row height divides whatever height is left.
 */
function grid(width: number, height: number, tiles: number) {
  const gutter = Math.min(56, Math.max(14, width * 0.03));
  const inner = Math.min(width, MAX_CONTENT) - gutter * 2;
  const fitting = Math.max(1, Math.min(tiles, Math.floor((inner + GAP) / (MIN_TILE + GAP))));
  const rows = Math.ceil(tiles / fitting);
  const columns = Math.ceil(tiles / rows);
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: height
      ? `${Math.max(MIN_ROW, Math.floor((height - GAP * (rows - 1)) / rows))}px`
      : 'minmax(150px, auto)',
  };
}

export function ProjectsView() {
  const { t, pick } = useLanguage();
  const { transitioning } = useTransition();
  const section = useRef<HTMLElement>(null);
  const space = useAvailableSpace(section, transitioning);

  return (
    <section ref={section} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.grid} style={grid(space.width || 1280, space.height, sectors.length)}>
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
