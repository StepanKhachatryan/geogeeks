'use client';

import { useRef, useState } from 'react';
import { serviceGroups } from '@/data/services';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useAvailableSpace } from '@/hooks/useAvailableSpace';
import { useTransition } from './TransitionProvider';
import styles from './ServicesView.module.css';

/** Below this much free height the expanded panel scrolls with the page instead. */
const FIT_THRESHOLD = 620;

export function ServicesView() {
  const { t, pick } = useLanguage();
  const { transitioning } = useTransition();
  const section = useRef<HTMLElement>(null);
  const space = useAvailableSpace(section, transitioning);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [subKey, setSubKey] = useState<string | null>(null);

  const openGroup = serviceGroups.find((group) => group.key === openKey) ?? null;
  const activeSub = openGroup
    ? (openGroup.subs.find((sub) => sub.key === subKey) ?? openGroup.subs[0])
    : null;

  const open = (key: string) => {
    const group = serviceGroups.find((item) => item.key === key);
    if (!group) return;
    setOpenKey(group.key);
    setSubKey(group.subs[0].key);
  };

  const expandedHeight = space.height >= FIT_THRESHOLD ? `${space.height}px` : 'auto';

  return (
    <section ref={section} className={styles.section}>
      <div className={styles.inner}>
        {!openGroup && (
          <div className={styles.cards}>
            {serviceGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                data-reveal
                onClick={() => open(group.key)}
                className={styles.card}
              >
                <span className={styles.cardMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={group.cardImg} alt="" className={styles.cardImage} />
                  <span className={styles.cardScrim} style={{ background: group.scrim }} />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{pick(group.cardTitle, group.cardTitleEn)}</span>
                  <span className={styles.cardDesc}>{pick(group.cardDesc, group.cardDescEn)}</span>
                  <span className={styles.chips}>
                    {group.chips.map((chip) => (
                      <span
                        key={chip.label}
                        className={styles.chip}
                        style={{ background: chip.background, color: chip.color }}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {openGroup && activeSub && (
          <div className={styles.expanded} style={{ height: expandedHeight }}>
            {/* Fixed order: selecting a service must not reorder the row. */}
            <div className={styles.compactRow}>
              {serviceGroups.map((group) => {
                const on = group.key === openGroup.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => open(group.key)}
                    className={`${styles.compact} ${on ? styles.compactOn : ''}`}
                  >
                    <span
                      className={styles.compactImage}
                      style={{ backgroundImage: `url('${group.cardImg}')` }}
                    />
                    <span className={styles.compactBody}>
                      <span className={styles.compactTitle}>
                        {pick(group.cardTitle, group.cardTitleEn)}
                      </span>
                      <span className={`${styles.compactMeta} ${on ? styles.compactMetaOn : ''}`}>
                        {on ? t('services.open') : t('services.more')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div className={styles.subs}>
                  {openGroup.subs.map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => setSubKey(sub.key)}
                      className={`${styles.sub} ${sub.key === activeSub.key ? styles.subOn : ''}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpenKey(null);
                    setSubKey(null);
                  }}
                  className={styles.close}
                >
                  {t('services.close')}
                </button>
              </div>

              <div className={styles.panelBody}>
                <div className={styles.copy}>
                  <p className={styles.subDesc}>{activeSub.desc}</p>
                  <ul className={styles.items}>
                    {activeSub.items.map(([label, text]) => (
                      <li key={label} className={styles.item}>
                        <strong className={styles.itemLabel}>{label}</strong> {text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={styles.subImage}
                  style={{ backgroundImage: `url('${activeSub.img}')` }}
                  role="img"
                  aria-label={activeSub.label}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
