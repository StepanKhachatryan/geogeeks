'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { MessageKey } from '@/i18n/messages';
import {
  CODE_LENGTH,
  createRequest,
  IDRAM_QR_IMAGE,
  isCodeComplete,
  isPhoneComplete,
  normalizeCode,
  normalizePhone,
  PHONE_DIGITS,
  PHONE_PREFIX,
  requestStatus,
  SUPPORT_EMAIL,
  verifyCode,
  type RequestStatus,
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

/** How the request is polled while the owner checks the payment. */
const POLL_INTERVAL = 4000;
const POLL_LIMIT = 75; // about five minutes

export function UnlockGate({ config, onUnlocked }: Props) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [message, setMessage] = useState<MessageKey | null>(null);
  const codeField = useRef<HTMLInputElement>(null);

  const phoneReady = isPhoneComplete(phone);
  const endpoint = config.requestEndpoint;

  // While a request is open, ask the backend where it stands.
  useEffect(() => {
    if (!token || !endpoint) return;
    if (status === 'approved' || status === 'rejected') return;

    let polls = 0;
    const timer = window.setInterval(async () => {
      polls += 1;
      const next = await requestStatus(endpoint, token);
      if (next !== 'unknown') setStatus(next);
      if (next === 'approved') codeField.current?.focus();
      if (polls >= POLL_LIMIT || next === 'approved' || next === 'rejected') {
        window.clearInterval(timer);
      }
    }, POLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [token, status, endpoint]);

  const sendRequest = async () => {
    if (!endpoint || !phoneReady || sending) return;
    setSending(true);
    setMessage(null);
    const created = await createRequest(endpoint, phone);
    setSending(false);

    if (!created.ok) {
      setMessage(created.reason === 'rate' ? 'unlock.rate' : 'unlock.network');
      return;
    }

    setToken(created.token);
    setStatus('pending');
    // Opening the bot is what binds the customer's chat to this request. With
    // no bot configured there is nowhere to send the code, so say so.
    if (created.botUrl) window.open(created.botUrl, '_blank', 'noopener');
    else setMessage('unlock.noBot');
  };

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

  const waiting = status === 'pending' || status === 'linked';

  return (
    <div className={styles.gate}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('unlock.title')}</h3>
        <p className={styles.price}>{config.price ?? t('unlock.price')}</p>
      </div>

      <div className={styles.body}>
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>
              <span className={styles.step}>1</span>
              {t('unlock.phoneLabel')}
            </span>
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

          <button
            type="button"
            className={styles.primary}
            disabled={!phoneReady || sending}
            onClick={() => void sendRequest()}
          >
            {sending ? t('unlock.sending') : t('unlock.sendRequest')}
          </button>

          {waiting && <p className={styles.waiting}>{t('unlock.waiting')}</p>}
          {status === 'approved' && <p className={styles.ok}>{t('unlock.approved')}</p>}
          {status === 'rejected' && <p className={styles.error}>{t('unlock.rejected')}</p>}

          <label className={styles.field}>
            <span className={styles.label}>
              <span className={styles.step}>2</span>
              {t('unlock.codeLabel')}
            </span>
            <input
              ref={codeField}
              className={`${styles.input} ${styles.code}`}
              value={code}
              maxLength={CODE_LENGTH}
              autoComplete="one-time-code"
              placeholder={'X'.repeat(CODE_LENGTH)}
              disabled={!phoneReady}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
            />
          </label>

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

        <div className={styles.pay}>
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
          <p className={styles.idram}>
            {t('unlock.idramId')}: <strong>{config.idramId}</strong>
          </p>
          <p className={styles.hint}>{t('unlock.flow')}</p>
          <a className={styles.telegram} href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
