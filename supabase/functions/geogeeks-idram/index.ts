/**
 * Idram's side of the converter's payment.
 *
 * Three addresses, given to Idram once and served through the site's own domain
 * (see `public/_redirects`), so this function can move without asking Idram to
 * change anything:
 *
 *   /result   both server-to-server calls: the precheck and the confirmation
 *   /success  where Idram sends the customer after paying
 *   /fail     where Idram sends the customer when the payment did not happen
 *
 * A confirmation that checks out mints a code and parks it on the request, as
 * the owner's Confirm button does in Telegram; the page, already polling,
 * collects it. Nobody has to be awake for a sale.
 *
 * Environment: IDRAM_REC_ACCOUNT and IDRAM_SECRET_KEY (from Idram; without them
 * every call is refused and the site keeps the manual flow), SITE_URL
 * (optional), TELEGRAM_BOT_TOKEN and TELEGRAM_OWNER_ID (optional: the owner is
 * told about each payment, and about any that needs a person).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { judge, newCode, readFields } from './idram.ts';

const REC_ACCOUNT = Deno.env.get('IDRAM_REC_ACCOUNT') ?? '';
const SECRET_KEY = Deno.env.get('IDRAM_SECRET_KEY') ?? '';
const SITE = (Deno.env.get('SITE_URL') ?? 'https://geogeeks.am').replace(/\/+$/, '');
const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const OWNER_ID = Deno.env.get('TELEGRAM_OWNER_ID') ?? '';
const VALID_DAYS = 14;
const CONVERTER = '/tools/shp-to-dxf/';

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

/** Back to the converter, which reads the flag and says how the payment went. */
const backToSite = (outcome: 'success' | 'fail') =>
  new Response(null, {
    status: 303,
    headers: { Location: `${SITE}${CONVERTER}?idram=${outcome}` },
  });

async function tellOwner(message: string) {
  if (!TOKEN || !OWNER_ID) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: OWNER_ID, text: message }),
    });
    if (!response.ok) console.error('telegram failed', await response.text());
  } catch (error) {
    console.error('telegram failed', error);
  }
}

/** What the owner is told for each outcome; `issued` is news, the rest are work. */
const OWNER_NOTE: Record<string, string> = {
  issued: '✅ Idram վճարում, կոդը տրվեց ավտոմատ։',
  already_paid: '⚠️ Կրկնակի վճարում արդեն վճարված հաշվի համար։ Ստուգեք և վերադարձրեք։',
  mismatch: '⚠️ Վճարված գումարը չի համընկնում հաշվի գնի հետ։ Կոդ չի տրվել։',
  unknown_bill: '⚠️ Վճարում անհայտ հաշվի համարով։ Կոդ չի տրվել։',
};

async function handleResult(request: Request): Promise<Response> {
  if (!REC_ACCOUNT || !SECRET_KEY) {
    console.error('idram call refused: IDRAM_REC_ACCOUNT or IDRAM_SECRET_KEY is not set');
    return text('NOT CONFIGURED', 503);
  }

  const raw = await request.text();
  const fields = readFields(new URLSearchParams(raw), new URL(request.url).searchParams);
  const verdict = judge(fields, REC_ACCOUNT, SECRET_KEY);

  if (verdict.kind === 'reject') {
    console.warn('idram call rejected', verdict.reason, fields.EDP_BILL_NO ?? '');
    return text('REJECTED');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  if (verdict.kind === 'precheck') {
    const { data, error } = await supabase.rpc('geogeeks_idram_precheck', {
      p_bill_no: verdict.billNo,
      p_amount: verdict.amount,
    });
    if (error) {
      console.error('precheck failed', error.message);
      return text('ERROR', 500);
    }
    // Only a bare OK lets the customer pay. Anything else stops the payment
    // before money moves, which is the right answer to a bill we do not know.
    return text(data === true ? 'OK' : 'NO');
  }

  // Never keep the checksum: it is derived from the secret key.
  const { EDP_CHECKSUM: _checksum, ...kept } = fields;
  const { data, error } = await supabase.rpc('geogeeks_idram_confirm', {
    p_trans_id: verdict.transId,
    p_bill_no: verdict.billNo,
    p_rec_account: REC_ACCOUNT,
    p_payer_account: verdict.payerAccount,
    p_amount: verdict.amount,
    p_trans_date: verdict.transDate,
    p_raw: kept,
    p_code: newCode(),
    p_days: VALID_DAYS,
  });
  if (error) {
    // Not OK, so Idram emails the merchant and the payment is not lost.
    console.error('confirm failed', error.message);
    return text('ERROR', 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const outcome: string = row?.outcome ?? 'unknown';
  console.log('idram confirmation', verdict.billNo, verdict.transId, outcome);

  if (outcome !== 'duplicate') {
    const note = OWNER_NOTE[outcome] ?? `Idram: ${outcome}`;
    await tellOwner(
      `${note}\nՀաշիվ՝ #${verdict.billNo}\nԳումար՝ ${verdict.amount} ֏\n` +
        `Համար՝ ${row?.phone ?? '—'}\nԳործարք՝ ${verdict.transId}`,
    );
  }

  // The payment is recorded whatever its outcome; one that needs a person has
  // just been put in front of the owner. OK stops Idram from resending it.
  return text('OK');
}

Deno.serve(async (request) => {
  const path = new URL(request.url).pathname.replace(/\/+$/, '');

  if (path.endsWith('/result')) {
    if (request.method !== 'POST') return text('METHOD', 405);
    return await handleResult(request);
  }
  // Idram may send the customer here with a GET or a POST; both just go home.
  if (path.endsWith('/success')) return backToSite('success');
  if (path.endsWith('/fail')) return backToSite('fail');

  return text('NOT FOUND', 404);
});
