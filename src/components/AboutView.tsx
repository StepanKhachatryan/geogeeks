'use client';

import Image from 'next/image';
import { partners } from '@/data/partners';
import { team } from '@/data/team';
import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './AboutView.module.css';

export function AboutView() {
  const { t, pick } = useLanguage();

  return (
    <>
      <section className={styles.about}>
        <div data-parallax="0.08" className={styles.blob} aria-hidden />
        <div className={styles.inner}>
          <div className={styles.intro}>
            <div>
              <h1 data-reveal className={styles.introTitle}>
                {t('about.heading')}
              </h1>
            </div>
            <div className={styles.introBody}>
              <p data-reveal className={styles.introText}>
                {t('about.intro')}
              </p>
            </div>
          </div>

          <h2 data-reveal className={styles.teamTitle}>
            {t('about.team')}
          </h2>
          <div className={styles.teamGrid}>
            {team.map((member) => {
              const name = pick(member.name, member.nameEn);
              return (
                <div key={member.name} data-reveal className={styles.member}>
                  <div className={styles.avatar}>
                    <div
                      className={styles.avatarImage}
                      style={{ backgroundImage: `url('${member.img}')` }}
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
                      rel="noreferrer"
                      className={styles.linkedin}
                      aria-label={`LinkedIn — ${name}`}
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
                <span className={styles.partnerLogo} style={{ backgroundImage: `url('${partner.img}')` }} />
                <span className={styles.partnerName}>{partner.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
