'use client';

import Image from 'next/image';
import { partners } from '@/data/partners';
import { team } from '@/data/team';
import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './AboutView.module.css';

/** Behind each portrait, in turn: the site's own colours. */
const CAPSULE_COLORS = ['var(--gg-teal)', 'var(--gg-yellow)', 'var(--gg-green)', 'var(--gg-ink)'];

export function AboutView() {
  const { t, pick } = useLanguage();

  return (
    <>
      <section className={styles.about}>
        <div className={styles.inner}>
          {/* The vision over a landscape, with the founding year set huge in a
              frosted band at the foot and cut off by the card's edge. */}
          <div className={styles.hero}>
            <div className={styles.heroTop}>
              <h1 data-reveal className={styles.heroTitle}>
                {t('about.heading')}
              </h1>
              <p data-reveal className={styles.heroText}>
                {t('about.intro')}
              </p>
            </div>
            <div className={styles.glass}>
              <div className={styles.glassRow}>
                <span>{t('about.visionLabel')}</span>
                <span className={styles.glassLine} aria-hidden />
                <span>{t('about.place')}</span>
              </div>
              <div className={styles.year} aria-hidden>
                2021
              </div>
            </div>
          </div>

          <h2 data-reveal className={styles.teamTitle}>
            {t('about.team')}
          </h2>
          <div className={styles.teamGrid}>
            {team.map((member, index) => {
              const name = pick(member.name, member.nameEn);
              return (
                <div key={member.name} data-reveal className={styles.member}>
                  <div
                    className={styles.capsule}
                    style={{ background: CAPSULE_COLORS[index % CAPSULE_COLORS.length] }}
                  >
                    <div
                      className={styles.cutout}
                      style={{ backgroundImage: `url('${member.cutout}')` }}
                      role="img"
                      aria-label={name}
                    />
                  </div>
                  <h3 className={styles.memberName}>{name}</h3>
                  <p className={styles.memberRole}>{pick(member.role, member.roleEn)}</p>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedin}
                      aria-label={`LinkedIn - ${name}`}
                    >
                      <Image
                        src="/assets/img/icons/LinkedIn_icon.png"
                        alt=""
                        width={18}
                        height={18}
                        className={styles.linkedinIcon}
                      />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.partners}>
        <div className={styles.partnersInner}>
          <h2 data-reveal className={styles.partnersTitle}>
            {t('about.partners')}
          </h2>
          <div className={styles.partnersGrid}>
            {partners.map((partner) => (
              <a
                key={partner.img}
                data-reveal
                href={partner.url}
                target="_blank"
                rel="noreferrer"
                title={partner.name}
                className={styles.partner}
              >
                <span
                  className={styles.partnerLogo}
                  style={{ backgroundImage: `url('${partner.img}')` }}
                  role="img"
                  aria-label={partner.name}
                />
                <span className={styles.partnerName}>{partner.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
