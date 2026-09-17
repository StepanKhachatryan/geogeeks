'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [message, setMessage] = useState<MessageKey | null>(null);
  const codeField = useRef<HTMLInputElement>(null);
  /** Stops the arriving code from being spent twice. */
  const submitted = useRef(false);

  const phoneReady = isPhoneComplete(phone);
  const endpoint = config.requestEndpoint;

  const submit = useCallback(
    async (value: string) => {
      if (!config.endpoint || !phoneReady || !isCodeComplete(value) || submitted.current) return;
      submitted.current = true;
      setChecking(true);
      setMessage(null);
      const outcome = await verifyCode(config.endpoint, phone, value);
      setChecking(false);
      if (outcome === 'ok') {
        setMessage('unlock.unlocked');
        onUnlocked();
        return;
      }
      submitted.current = false;
      setMessage(OUTCOME_MESSAGE[outcome]);
    },
    [config.endpoint, onUnlocked, phone, phoneReady],
  );

  // While a request is open, ask the backend where it stands. An approved one
  // brings the code with it, so the customer never leaves the page.
  useEffect(() => {
    if (!token || !endpoint) return;
    if (status === 'approved' || status === 'rejected') return;

    let polls = 0;
    const timer = window.setInterval(async () => {
      polls += 1;
      const next = await requestStatus(endpoint, token);
      if (next.status !== 'unknown') setStatus(next.status);
      if (next.status === 'approved' && next.code) {
        setCode(next.code);
        void submit(next.code);
      } else if (next.status === 'approved') {
        codeField.current?.focus();
      }
      if (polls >= POLL_LIMIT || next.status === 'approved' || next.status === 'rejected') {
        window.clearInterval(timer);
      }
    }, POLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [token, status, endpoint, submit]);

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
    setBotUrl(created.botUrl);
    setStatus('pending');
    // With no bot reachable there is nobody to confirm the payment, so say what
    // to do instead rather than leaving the customer watching a spinner.
    if (!created.notified) setMessage('unlock.noBot');
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

          {waiting && (
            <>
              <p className={styles.waiting}>{t('unlock.waiting')}</p>
              {botUrl && (
                <a
                  className={styles.link}
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('unlock.alsoTelegram')}
                </a>
              )}
            </>
          )}
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
            onClick={() => void submit(code)}
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
          {/* Idram shows the note beside the transfer, which is how a payment is
              matched to the number asking for a code. */}
          <p className={styles.note}>{t('unlock.note')}</p>
          <p className={styles.hint}>
            {t('unlock.flow')}{' '}
            <a className={styles.mail} href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
