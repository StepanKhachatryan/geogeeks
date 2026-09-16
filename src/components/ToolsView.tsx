'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import { TransitionLink } from './TransitionLink';
import styles from './ToolsView.module.css';

const tools = [
  { href: '/tools/shp-to-dxf', name: 'tool.shpdxf.name', summary: 'tool.shpdxf.summary' },
] as const;

export function ToolsView() {
  const { t } = useLanguage();

  return (
    <section className="gg-section">
      <div className="gg-inner">
        <h1 className={styles.title}>{t('tools.title')}</h1>
        <p className={styles.intro}>{t('tools.intro')}</p>

        <div className={styles.grid}>
          {tools.map((tool) => (
            <TransitionLink key={tool.href} href={tool.href} className={styles.card} data-reveal>
              <span className={styles.badge}>DXF</span>
              <h2 className={styles.cardTitle}>{t(tool.name)}</h2>
              <p className={styles.cardText}>{t(tool.summary)}</p>
              <span className={styles.cta}>{t('tools.open')}</span>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
