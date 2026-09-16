/**
 * Opens and tracks a request for an unlock code.
 *
 * The page calls `create` once a customer has paid and typed the number they
 * paid from. It answers with a token and, when a bot is configured, the deep
 * link that hands that token to Telegram. Opening the bot is what tells us where
 * to send the code; a phone number alone cannot be messaged on Telegram.
 *
 * `status` is what the page polls while the owner checks the payment.
 *
 * Environment: TELEGRAM_BOT_USERNAME (optional; without it the page falls back
 * to email), ALLOWED_ORIGINS (optional).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT = Deno.env.get('TELEGRAM_BOT_USERNAME') ?? '';
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
    return json({ ok: true, status: data ?? 'unknown' });
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
  if (data === 'rate') return json({ ok: false, reason: 'rate' }, 429);

  return json({
    ok: true,
    token,
    botUrl: BOT ? `https://t.me/${BOT}?start=${token}` : null,
  });
});
