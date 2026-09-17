'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import { ShpToDxfTool } from './ShpToDxfTool';
import styles from './ShpToDxfView.module.css';

export function ShpToDxfView() {
  const { t } = useLanguage();

  return (
    <section className={`gg-section ${styles.section}`}>
      <div className={`gg-inner ${styles.inner}`}>
        <h1 className={styles.title}>{t('tool.shpdxf.name')}</h1>
        <p className={styles.intro}>{t('tool.shpdxf.summary')}</p>

        <ShpToDxfTool
          guide={
            <div className={styles.how}>
              <h2 className={styles.howTitle}>{t('tool.how')}</h2>
              {/* Two columns on a laptop: this panel sits under the payment
                  block, and stacked it pushed the page into a scroll. */}
              <div className={styles.howBody}>
                <ol className={styles.steps}>
                  <li>{t('tool.how1')}</li>
                  <li>{t('tool.how2')}</li>
                  <li>{t('tool.how3')}</li>
                </ol>
                <p className={styles.notes}>{t('tool.notes')}</p>
              </div>
            </div>
          }
          notice={
            /* The files never leave the visitor's machine, so the result is only
               ever as good as what they supplied. Said plainly, under the
               converter, where there is room for it to be read. */
            <p className={styles.disclaimer}>
              <strong>{t('tool.disclaimerTitle')}.</strong> {t('tool.disclaimer')}
            </p>
          }
        />
      </div>
    </section>
  );
}
