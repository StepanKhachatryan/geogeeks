'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import { ShpToDxfTool } from './ShpToDxfTool';
import { TransitionLink } from './TransitionLink';
import styles from './ShpToDxfView.module.css';

export function ShpToDxfView() {
  const { t } = useLanguage();

  return (
    <section className="gg-section">
      <div className={`gg-inner ${styles.inner}`}>
        <div className="gg-page-header">
          <div className="gg-kicker">{t('tools.title')}</div>
          <TransitionLink href="/tools" className="gg-back">
            {t('common.back')}
          </TransitionLink>
        </div>

        <h1 className={styles.title}>{t('tool.shpdxf.name')}</h1>
        <p className={styles.intro}>{t('tool.shpdxf.summary')}</p>

        <ShpToDxfTool />

        <div className={styles.how}>
          <h2 className={styles.howTitle}>{t('tool.how')}</h2>
          <ol className={styles.steps}>
            <li>{t('tool.how1')}</li>
            <li>{t('tool.how2')}</li>
            <li>{t('tool.how3')}</li>
          </ol>
          <p className={styles.notes}>{t('tool.notes')}</p>
        </div>
      </div>
    </section>
  );
}
