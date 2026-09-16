/**
 * Checks a one-time code and marks it used.
 *
 * Called by the converter page. The browser never learns anything about a code
 * it did not already have: the answer is a plain yes or no.
 *
 * Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNLOCK_PEPPER,
 * ALLOWED_ORIGIN (defaults to the live site).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://geogeeks.am';
const PEPPER = Deno.env.get('UNLOCK_PEPPER') ?? '';
const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 10;

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ ok: false, reason: 'method' }, 405);

  let phone = '';
  let code = '';
  try {
    const body = await request.json();
    phone = String(body.phone ?? '').replace(/[^\d+]/g, '');
    code = String(body.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
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

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await supabase
    .from('unlock_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', since);

  if ((count ?? 0) >= MAX_ATTEMPTS) return json({ ok: false, reason: 'rate' }, 429);

  const hash = await sha256(`${PEPPER}:${phone}:${code}`);
  const { data: row } = await supabase
    .from('unlock_codes')
    .select('id, expires_at, used_at')
    .eq('code_hash', hash)
    .eq('phone', phone)
    .maybeSingle();

  const record = async (succeeded: boolean) => {
    await supabase.from('unlock_attempts').insert({ phone, succeeded });
  };

  if (!row || row.used_at) {
    await record(false);
    return json({ ok: false, reason: 'invalid' });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await record(false);
    return json({ ok: false, reason: 'expired' });
  }

  // Single use: the update only succeeds while used_at is still empty, so two
  // requests racing with the same code cannot both win.
  const { data: claimed } = await supabase
    .from('unlock_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();

  await record(Boolean(claimed));
  return json(claimed ? { ok: true } : { ok: false, reason: 'invalid' });
});
