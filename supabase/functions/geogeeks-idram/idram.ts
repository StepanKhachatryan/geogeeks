/**
 * The Idram merchant protocol, kept free of any runtime so it can be tested on
 * its own. `node:crypto` exists in both Deno and Node.
 *
 * Idram calls RESULT_URL twice per payment, as x-www-form-urlencoded POSTs:
 *
 *  1. a precheck (EDP_PRECHECK=YES) before any money moves -- "is this bill
 *     yours, and still open?" It carries no checksum.
 *  2. a confirmation after the transfer, signed with EDP_CHECKSUM: the MD5 of
 *     REC_ACCOUNT:AMOUNT:SECRET_KEY:BILL_NO:PAYER_ACCOUNT:TRANS_ID:TRANS_DATE.
 *
 * Anything but a bare "OK" refuses the precheck, which stops the payment, and
 * on the confirmation makes Idram email the merchant instead.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

export type Fields = Record<string, string>;

/**
 * The EDP_ fields, from the form body first and the query string second: the
 * documentation shows them as a form but also calls them "parameters with
 * query string", so both are read rather than guessing which Idram uses.
 */
export function readFields(body: URLSearchParams, query: URLSearchParams): Fields {
  const fields: Fields = {};
  for (const source of [query, body]) {
    source.forEach((value, key) => {
      fields[key] = value.trim();
    });
  }
  return fields;
}

export const isPrecheck = (fields: Fields) => fields.EDP_PRECHECK?.toUpperCase() === 'YES';

/** Bills are numbers on our side; anything else cannot be one of ours. */
export function parseBill(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,18}$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

/** "300" and "300.00" are the same price; "1e3" and "300,00" are not amounts. */
export function parseAmount(raw: string | undefined): number | null {
  if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * The signature Idram puts on a confirmation. Computed from the strings exactly
 * as received: reformatting the amount ("300" for "300.00") changes the hash.
 */
export function expectedChecksum(fields: Fields, secretKey: string): string {
  const parts = [
    fields.EDP_REC_ACCOUNT ?? '',
    fields.EDP_AMOUNT ?? '',
    secretKey,
    fields.EDP_BILL_NO ?? '',
    fields.EDP_PAYER_ACCOUNT ?? '',
    fields.EDP_TRANS_ID ?? '',
    fields.EDP_TRANS_DATE ?? '',
  ];
  return createHash('md5').update(parts.join(':'), 'utf8').digest('hex');
}

/** Constant-time and case-blind: MD5 hex may arrive in either case. */
export function checksumMatches(fields: Fields, secretKey: string): boolean {
  const received = (fields.EDP_CHECKSUM ?? '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(received)) return false;
  const encode = (text: string) => new TextEncoder().encode(text);
  return timingSafeEqual(encode(received), encode(expectedChecksum(fields, secretKey)));
}

export type Verdict =
  | { kind: 'precheck'; billNo: number; amount: number }
  | {
      kind: 'confirmation';
      billNo: number;
      amount: number;
      transId: string;
      payerAccount: string;
      transDate: string;
    }
  | { kind: 'reject'; reason: string };

/**
 * Everything that can be decided without the database: is this addressed to
 * us, well formed, and -- for a confirmation -- genuinely from Idram.
 */
export function judge(fields: Fields, recAccount: string, secretKey: string): Verdict {
  if ((fields.EDP_REC_ACCOUNT ?? '') !== recAccount) return { kind: 'reject', reason: 'account' };

  const billNo = parseBill(fields.EDP_BILL_NO);
  if (billNo === null) return { kind: 'reject', reason: 'bill' };

  const amount = parseAmount(fields.EDP_AMOUNT);
  if (amount === null) return { kind: 'reject', reason: 'amount' };

  if (isPrecheck(fields)) return { kind: 'precheck', billNo, amount };

  if (!checksumMatches(fields, secretKey)) return { kind: 'reject', reason: 'checksum' };

  const transId = fields.EDP_TRANS_ID ?? '';
  if (!/^[A-Za-z0-9]{1,32}$/.test(transId)) return { kind: 'reject', reason: 'transaction' };

  return {
    kind: 'confirmation',
    billNo,
    amount,
    transId,
    payerAccount: fields.EDP_PAYER_ACCOUNT ?? '',
    transDate: fields.EDP_TRANS_DATE ?? '',
  };
}

/** No I, O, 0 or 1: a code gets read aloud and typed by hand. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}
