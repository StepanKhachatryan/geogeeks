'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import {
  CODE_LENGTH,
  IDRAM_QR_IMAGE,
  isCodeComplete,
  isPhoneComplete,
  normalizeCode,
  normalizePhone,
  PHONE_DIGITS,
  PHONE_PREFIX,
  SUPPORT_EMAIL,
  verifyCode,
  type UnlockConfig,
} from '@/lib/unlock';
import styles from './UnlockGate.module.css';

type Props = {
  config: UnlockConfig;
  /** Runs once the code has been accepted. */
  onUnlocked: () => void;
};

const OUTCOME_MESSAGE: Record<string, MessageKey> = {
  invalid: 'unlock.invalid',
  expired: 'unlock.expired',
  rate: 'unlock.rate',
  network: 'unlock.network',
};

export function UnlockGate({ config, onUnlocked }: Props) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);

  const phoneReady = isPhoneComplete(phone);

  const submit = async () => {
    if (!config.endpoint || !phoneReady || !isCodeComplete(code)) return;
    setChecking(true);
    setMessage(null);
    const outcome = await verifyCode(config.endpoint, phone, code);
    setChecking(false);
    if (outcome === 'ok') {
      setMessage('unlock.unlocked');
      onUnlocked();
      return;
    }
    setMessage(OUTCOME_MESSAGE[outcome]);
  };

  return (
    <div className={styles.gate}>
      <h3 className={styles.title}>{t('unlock.title')}</h3>
      {config.price && <p className={styles.price}>{config.price}</p>}

      <label className={styles.field}>
        <span className={styles.label}>{t('unlock.phoneLabel')}</span>
        <span className={styles.phoneRow}>
          <span className={styles.prefix}>{PHONE_PREFIX}</span>
          <input
            className={styles.input}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={'0'.repeat(PHONE_DIGITS)}
            value={phone}
            onChange={(event) => setPhone(normalizePhone(event.target.value))}
          />
        </span>
        <span className={styles.hint}>{t('unlock.phoneHint')}</span>
      </label>

      {phoneReady && (
        <div className={styles.payment}>
          {!qrMissing && (
            <div className={styles.qr}>
              <Image
                src={IDRAM_QR_IMAGE}
                alt="Idram QR"
                width={200}
                height={200}
                className={styles.qrImage}
                onError={() => setQrMissing(true)}
                unoptimized
              />
            </div>
          )}
          <div className={styles.payText}>
            <p className={styles.payTitle}>{t('unlock.payTitle')}</p>
            <p className={styles.idram}>
              {t('unlock.idramId')}: <strong>{config.idramId}</strong>
            </p>
            <p className={styles.hint}>{t('unlock.payHint')}</p>
            {/* The code comes back over Telegram once a bot is configured, and
                by email until then. */}
            <p className={styles.hint}>
              {config.telegram ? t('unlock.codeViaTelegram') : t('unlock.codeViaEmail')}
            </p>
            {config.telegram ? (
              <a
                className={styles.telegram}
                href={`https://t.me/${config.telegram}?text=${encodeURIComponent(`${PHONE_PREFIX}${phone}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('unlock.telegram')}
              </a>
            ) : (
              <a
                className={styles.telegram}
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Shapefile → DXF')}&body=${encodeURIComponent(`${PHONE_PREFIX}${phone}`)}`}
              >
                {SUPPORT_EMAIL}
              </a>
            )}
          </div>
        </div>
      )}

      {phoneReady && (
        <label className={styles.field}>
          <span className={styles.label}>{t('unlock.codeLabel')}</span>
          <input
            className={`${styles.input} ${styles.code}`}
            value={code}
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            placeholder={'X'.repeat(CODE_LENGTH)}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
          />
          <span className={styles.hint}>{t('unlock.codeHint')}</span>
        </label>
      )}

      <button
        type="button"
        className={styles.primary}
        disabled={!phoneReady || !isCodeComplete(code) || checking}
        onClick={() => void submit()}
      >
        {checking ? t('unlock.checking') : t('unlock.verify')}
      </button>

      {message && (
        <p className={message === 'unlock.unlocked' ? styles.ok : styles.error}>{t(message)}</p>
      )}
    </div>
  );
}
