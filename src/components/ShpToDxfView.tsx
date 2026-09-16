'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import { ShpToDxfTool } from './ShpToDxfTool';
import styles from './ShpToDxfView.module.css';

export function ShpToDxfView() {
  const { t } = useLanguage();

  return (
    <section className="gg-section">
      <div className={`gg-inner ${styles.inner}`}>
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
