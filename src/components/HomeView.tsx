'use client';

import { useEffect, useRef, useState } from 'react';
import { products } from '@/data/products';
import { latestProjects } from '@/data/projects';
import { useLanguage } from '@/i18n/LanguageProvider';
import { motion } from '@/lib/tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TransitionLink } from './TransitionLink';
import { useTransition } from './TransitionProvider';
import styles from './HomeView.module.css';

const latest = latestProjects();

export function HomeView() {
  const { t, pick } = useLanguage();
  const { transitioning } = useTransition();
  const reducedMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const fadeTargets = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion || transitioning || products.length < 2) return;
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % products.length),
      motion.heroInterval,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion, transitioning]);

  // Cross-fade: drop the image, title and description, then bring them back.
  useEffect(() => {
    if (reducedMotion) return;
    const elements = fadeTargets.current.filter(Boolean) as HTMLElement[];
    elements.forEach((el) => {
      el.style.opacity = '0.08';
    });
    const frame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() =>
        elements.forEach((el) => {
          el.style.opacity = '1';
        }),
      ),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [slide, reducedMotion]);

  const product = products[slide];

  return (
    <section className={styles.hero}>
      <div data-parallax="0.06" className={styles.blob} aria-hidden />

      <div data-parallax="-0.03" className={styles.stage}>
        <div
          ref={(el) => {
            fadeTargets.current[0] = el;
          }}
          className={styles.image}
          style={{ backgroundImage: `url('${product.img}')` }}
          role="img"
          aria-label={pick(product.title, product.titleEn)}
        />
        <div className={styles.wash} aria-hidden />

        <div className={styles.caption}>
          <h1
            ref={(el) => {
              fadeTargets.current[1] = el;
            }}
            className={styles.title}
          >
            {pick(product.title, product.titleEn)}
          </h1>
          <p
            ref={(el) => {
              fadeTargets.current[2] = el;
            }}
            className={styles.description}
          >
            {pick(product.desc, product.descEn)}
          </p>
          <div className={styles.captionFoot}>
            <a href={product.url} target="_blank" rel="noreferrer" className={styles.cta}>
              {t('hero.openPlatform')}
            </a>
            <div className={styles.dots}>
              {products.map((item, index) => (
                <button
                  key={item.url}
                  type="button"
                  title={pick(item.title, item.titleEn)}
                  aria-label={pick(item.title, item.titleEn)}
                  aria-current={index === slide ? 'true' : undefined}
                  onClick={() => setSlide(index)}
                  className={`${styles.dot} ${index === slide ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.latest}>
        <h2 data-reveal className={styles.latestTitle}>
          {t('home.latest')}
        </h2>
        <div className={styles.latestGrid}>
          {latest.map(({ sector, project }) => (
            <TransitionLink
              key={`${sector.key}/${project.slug}`}
              href={`/projects/${sector.key}/${project.slug}`}
              className={styles.card}
              data-reveal
            >
              <div className={styles.cardMedia}>
                <div className={styles.cardImage} style={{ backgroundImage: `url('${project.card}')` }} />
                <span className={styles.year}>{project.year}</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardClient}>{project.client}</p>
                <span className={styles.cardCta}>{t('home.openProject')}</span>
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
