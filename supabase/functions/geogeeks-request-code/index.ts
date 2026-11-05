/**
 * Opens and tracks a request for an unlock code.
 *
 * The page calls `create` once a customer has paid and typed the number they
 * paid from. The owner's Telegram gets the request there and then, with Confirm
 * and Reject under it, so nothing is asked of the customer's own device: this
 * work happens on a desktop and Telegram usually lives on a phone.
 *
 * `status` is what the page polls while the owner decides. Once approved it
 * carries the code, so the customer never has to leave the page.
 *
 * Environment: TELEGRAM_BOT_TOKEN and TELEGRAM_OWNER_ID (without them a request
 * is stored but nobody is told about it), TELEGRAM_BOT_USERNAME (optional; the
 * page offers the deep link as a second way to receive the code),
 * ALLOWED_ORIGINS (optional).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT = Deno.env.get('TELEGRAM_BOT_USERNAME') ?? '';
const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const OWNER_ID = Deno.env.get('TELEGRAM_OWNER_ID') ?? '';
const DEFAULT_ORIGINS = ['https://geogeeks.am', 'https://www.geogeeks.am', 'http://localhost:3000'];
const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOWED = ORIGINS.length > 0 ? ORIGINS : DEFAULT_ORIGINS;

/** Telegram start payloads allow letters, digits, underscore and hyphen only. */
const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return [...bytes].map((byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join('');
}

function corsFor(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

/** Puts the request in front of the owner with the two buttons on it. */
async function announce(id: string, phone: string) {
  if (!TOKEN || !OWNER_ID) return;
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_ID,
      text: `Նոր հարցում՝ 300 ֏\nՀամար՝ ${phone}\n\nՍտուգեք Idram-ի մուտքը այս համարից և պատասխանեք:`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Հաստատել', callback_data: `ok:${id}` },
            { text: '❌ Մերժել', callback_data: `no:${id}` },
          ],
        ],
      },
    }),
  });
  if (!response.ok) console.error('announce failed', await response.text());
}

Deno.serve(async (request) => {
  const cors = corsFor(request);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'content-type': 'application/json' },
    });

  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ ok: false, reason: 'method' }, 405);

  let body: { action?: string; phone?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: 'body' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  if (body.action === 'status') {
    const token = String(body.token ?? '').slice(0, 64);
    if (!token) return json({ ok: false, reason: 'invalid' }, 400);
    const { data, error } = await supabase.rpc('geogeeks_unlock_request_status', {
      p_token: token,
    });
    if (error) {
      console.error('status failed', error.message);
      return json({ ok: false, reason: 'server' }, 500);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return json({ ok: true, status: row?.status ?? 'unknown', code: row?.code ?? null });
  }

  const phone = String(body.phone ?? '').replace(/[^\d+]/g, '');
  if (!/^\+374\d{8}$/.test(phone)) return json({ ok: false, reason: 'invalid' }, 400);

  const token = newToken();
  const { data, error } = await supabase.rpc('geogeeks_create_unlock_request', {
    p_phone: phone,
    p_token: token,
  });

  if (error) {
    console.error('create failed', error.message);
    return json({ ok: false, reason: 'server' }, 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.status === 'rate') return json({ ok: false, reason: 'rate' }, 429);

  await announce(row.id, phone);

  return json({
    ok: true,
    token,
    // Only worth offering when the owner can actually be reached; otherwise the
    // page says to send the confirmation by email instead.
    notified: Boolean(TOKEN && OWNER_ID),
    botUrl: BOT ? `https://t.me/${BOT}?start=${token}` : null,
  });
});
