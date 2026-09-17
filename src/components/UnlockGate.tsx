'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

/**
 * How the request is polled while the owner checks the payment. The owner
 * confirms by hand and may not see the message at once, so the page promises
 * half an hour and keeps watching for a little longer than that -- quickly at
 * first, when they may be right there, and calmly after the first minute.
 */
const POLL_FAST = 4000;
const POLL_SLOW = 15000;
const POLL_FAST_FOR = 60_000;
const POLL_WINDOW = 35 * 60 * 1000;

/**
 * Half an hour is long enough to close the tab, and the code is only reachable
 * with the request's token, so the token outlives the page.
 */
const STORAGE_KEY = 'gg-unlock-request';
const STORAGE_MAX_AGE = 24 * 60 * 60 * 1000;

type StoredRequest = { token: string; phone: string; at: number; botUrl: string | null };

function readStored(): StoredRequest | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: StoredRequest = JSON.parse(raw);
    if (!value?.token || !value?.phone) return null;
    if (Date.now() - value.at > STORAGE_MAX_AGE) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Read through a store rather than in an effect: the page is prerendered, and
 * this keeps the server's "no request" and the browser's restored one from
 * disagreeing during hydration.
 */
let snapshot: StoredRequest | null | undefined;
const listeners = new Set<() => void>();

function storedRequest(): StoredRequest | null {
  if (snapshot === undefined) snapshot = readStored();
  return snapshot;
}

function subscribeStored(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeStored(value: StoredRequest | null) {
  snapshot = value;
  listeners.forEach((listener) => listener());
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A browser with storage switched off still works, it just cannot resume.
  }
}

export function UnlockGate({ config, onUnlocked }: Props) {
  const { t } = useLanguage();
  const restored = useSyncExternalStore(subscribeStored, storedRequest, () => null);
  const [typedPhone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [qrMissing, setQrMissing] = useState(false);
  const [sentToken, setToken] = useState<string | null>(null);
  const [sentBotUrl, setBotUrl] = useState<string | null>(null);
  const [reachedStatus, setStatus] = useState<RequestStatus | null>(null);
  const [message, setMessage] = useState<MessageKey | null>(null);

  // A request left open in a closed tab stands in until this visit opens one.
  const phone = typedPhone ?? restored?.phone ?? '';
  const token = sentToken ?? restored?.token ?? null;
  const botUrl = sentBotUrl ?? restored?.botUrl ?? null;
  const status = reachedStatus ?? (restored ? 'pending' : null);
  const codeField = useRef<HTMLInputElement>(null);
  /** Stops the arriving code from being spent twice. */
  const submitted = useRef(false);
  /** When the request was opened, which may have been in an earlier visit. */
  const openedAt = useRef<number | null>(null);

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
        writeStored(null);
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

    let stopped = false;
    let timer = 0;
    const opened = openedAt.current ?? restored?.at ?? Date.now();
    const since = () => Date.now() - opened;

    const check = async () => {
      const next = await requestStatus(endpoint, token);
      if (stopped) return;

      if (next.status !== 'unknown') setStatus(next.status);
      if (next.status === 'approved') {
        writeStored(null);
        if (next.code) {
          setCode(next.code);
          void submit(next.code);
        } else {
          codeField.current?.focus();
        }
        return;
      }
      if (next.status === 'rejected') {
        writeStored(null);
        return;
      }
      if (since() > POLL_WINDOW) {
        setMessage('unlock.slow');
        return;
      }
      timer = window.setTimeout(check, since() < POLL_FAST_FOR ? POLL_FAST : POLL_SLOW);
    };

    timer = window.setTimeout(check, POLL_FAST);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [token, status, endpoint, submit, restored]);

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

    openedAt.current = Date.now();
    setToken(created.token);
    setBotUrl(created.botUrl);
    setStatus('pending');
    writeStored({ token: created.token, phone, at: openedAt.current, botUrl: created.botUrl });
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
