'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { partners } from '@/data/partners';
import { team } from '@/data/team';
import { useLanguage } from '@/i18n/LanguageProvider';
import styles from './AboutView.module.css';

/** Behind each portrait, in turn: the site's own colours. */
const CAPSULE_COLORS = ['var(--gg-teal)', 'var(--gg-yellow)', 'var(--gg-green)', 'var(--gg-ink)'];

/** Side by side from this width; below it the vision keeps its CSS size. */
const SIDE_BY_SIDE = '(min-width: 900px)';

/** Largest font size, in px, at which `fits` still holds. */
function largest(el: HTMLElement, fits: () => boolean, max: number): number {
  let lo = 4;
  let hi = max;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (fits()) lo = mid;
    else hi = mid;
  }
  el.style.fontSize = `${lo}px`;
  return lo;
}

export function AboutView() {
  const { t, pick, lang } = useLanguage();
  const leftRef = useRef<HTMLHeadingElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const visionRef = useRef<HTMLParagraphElement>(null);

  // Text sized to its box needs measuring, so it runs after layout and again
  // whenever the column changes width, the fonts arrive or the language flips.
  useEffect(() => {
    const left = leftRef.current;
    const label = labelRef.current;
    const year = yearRef.current;
    const vision = visionRef.current;
    if (!left || !label || !year || !vision) return;

    const fit = () => {
      const width = left.clientWidth;
      largest(year, () => year.getBoundingClientRect().width <= width, 1000);
      largest(label, () => label.getBoundingClientRect().width <= width, 400);

      vision.style.fontSize = '';
      vision.style.lineHeight = '';
      if (!window.matchMedia(SIDE_BY_SIDE).matches) return;

      const target = left.getBoundingClientRect().height;
      vision.style.lineHeight = '1.45';
      largest(vision, () => vision.getBoundingClientRect().height <= target, 80);
      const line = parseFloat(getComputedStyle(vision).lineHeight);
      const lines = Math.max(1, Math.round(vision.getBoundingClientRect().height / line));
      vision.style.lineHeight = `${target / lines}px`;
    };

    fit();
    let alive = true;
    void document.fonts?.ready.then(() => alive && fit());
    const observer = new ResizeObserver(fit);
    observer.observe(left.parentElement ?? left);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [lang]);

  return (
    <>
      {/* Edge to edge over an aerial photo: the year fills the left column, the
          line above it is stretched to the year's width, and the vision on the
          right is sized to stand exactly as tall as the two together. */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 ref={leftRef} className={styles.founded}>
            <span ref={labelRef} className={styles.foundedLabel}>
              {t('about.founded')}
            </span>{' '}
            <span ref={yearRef} className={styles.foundedYear}>
              2021
            </span>
          </h1>
          <p ref={visionRef} className={styles.vision}>
            {t('about.intro')}
          </p>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.inner}>
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
                      style={{
                        backgroundImage: `url('${member.cutout}')`,
                        width: `${member.fit ?? 100}%`,
                      }}
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
