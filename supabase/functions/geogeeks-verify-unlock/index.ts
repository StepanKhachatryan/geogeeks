/**
 * Checks a one-time code and marks it used.
 *
 * Called by the converter page. The browser learns nothing about a code it did
 * not already hold: the answer is a plain yes or no. The comparison happens in
 * the database, against bcrypt hashes, so this function never sees a stored
 * code either.
 *
 * Environment: ALLOWED_ORIGINS (comma separated, optional). SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEFAULT_ORIGINS = ['https://geogeeks.am', 'https://www.geogeeks.am', 'http://localhost:3000'];
const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOWED = ORIGINS.length > 0 ? ORIGINS : DEFAULT_ORIGINS;

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

  let phone = '';
  let code = '';
  try {
    const body = await request.json();
    phone = String(body.phone ?? '').replace(/[^\d+]/g, '');
    code = String(body.code ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  } catch {
    return json({ ok: false, reason: 'body' }, 400);
  }

  if (!/^\+374\d{8}$/.test(phone) || code.length !== 6) {
    return json({ ok: false, reason: 'invalid' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('geogeeks_redeem_unlock_code', {
    p_phone: phone,
    p_code: code,
  });

  if (error) {
    console.error('redeem failed', error.message);
    return json({ ok: false, reason: 'server' }, 500);
  }
  if (data === 'rate') return json({ ok: false, reason: 'rate' }, 429);
  if (data === 'ok') return json({ ok: true });
  return json({ ok: false, reason: data ?? 'invalid' });
});
