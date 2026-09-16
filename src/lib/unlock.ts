/**
 * Payment gate for the converter.
 *
 * The conversion itself runs in the browser, so this gate is a commercial
 * check, not a security boundary: anyone who reads the page source can reach
 * the converter without paying. It exists to make paying the obvious path, and
 * it stays off until an endpoint is configured.
 *
 * The flow: the visitor enters the phone number they will pay from, pays the
 * Idram QR, asks for a code over Telegram, and types it here. The code is
 * checked by a Supabase Edge Function, which is the only party that can see
 * whether a code exists, is unused and belongs to that number.
 */

export const PHONE_PREFIX = '+374';
export const PHONE_DIGITS = 8;
export const CODE_LENGTH = 6;

/** Ambiguous characters are left out: no I, O, 0 or 1. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const IDRAM_QR_IMAGE = '/assets/img/payments/idram-qr.png';

/**
 * The account the QR points at. Shown as text as well, so a customer can pay by
 * ID from inside the Idram app when scanning is inconvenient, and so the step
 * still works if the QR image has not been added to the build.
 */
export const IDRAM_ID = process.env.NEXT_PUBLIC_IDRAM_ID ?? '750794530';

/**
 * The deployed verifier. Committed rather than left to host configuration, so
 * the live site is paid on the next deploy without touching dashboard settings.
 * It is a public URL; the secrets stay inside the Edge Function.
 */
const DEFAULT_ENDPOINT =
  'https://mejjprejtcyoyfoiocrq.supabase.co/functions/v1/geogeeks-verify-unlock';

export const SUPPORT_EMAIL = 'geogeeksllc@gmail.com';

export type UnlockConfig = {
  required: boolean;
  endpoint?: string;
  telegram?: string;
  price?: string;
  idramId: string;
};

/** Read at build time; every field can be overridden by the host. */
export function unlockConfig(): UnlockConfig {
  const flag = process.env.NEXT_PUBLIC_PAYMENT_REQUIRED;
  return {
    // `NEXT_PUBLIC_PAYMENT_REQUIRED=false` turns the tool free again.
    required: flag ? flag === 'true' : true,
    endpoint: process.env.NEXT_PUBLIC_UNLOCK_ENDPOINT ?? DEFAULT_ENDPOINT,
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_BOT,
    price: process.env.NEXT_PUBLIC_UNLOCK_PRICE,
    idramId: IDRAM_ID,
  };
}

export function normalizePhone(digits: string): string {
  return digits.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}

export function isPhoneComplete(digits: string): boolean {
  return new RegExp(`^\\d{${PHONE_DIGITS}}$`).test(digits);
}

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH);
}

export function isCodeComplete(code: string): boolean {
  return new RegExp(`^[A-Z0-9]{${CODE_LENGTH}}$`).test(code);
}

export type VerifyOutcome = 'ok' | 'invalid' | 'expired' | 'rate' | 'network';

/** Asks the Edge Function whether this code unlocks a download for this number. */
export async function verifyCode(
  endpoint: string,
  phoneDigits: string,
  code: string,
): Promise<VerifyOutcome> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: `${PHONE_PREFIX}${phoneDigits}`, code }),
    });
    if (response.status === 429) return 'rate';
    if (!response.ok) return 'network';
    const body: { ok?: boolean; reason?: string } = await response.json();
    if (body.ok) return 'ok';
    return body.reason === 'expired' ? 'expired' : 'invalid';
  } catch {
    return 'network';
  }
}
