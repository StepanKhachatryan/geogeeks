/**
 * Telegram bot that issues unlock codes.
 *
 * The owner sends "/code +37498098006" after seeing an Idram payment; the bot
 * generates a six-character code, stores its hash and replies with the code to
 * pass on to the customer. Any message from anyone else is relayed to the owner,
 * so a customer can send their payment confirmation in the same chat.
 *
 * Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNLOCK_PEPPER,
 * TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID, TELEGRAM_WEBHOOK_SECRET.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const OWNER_ID = Deno.env.get('TELEGRAM_OWNER_ID') ?? '';
const SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
const PEPPER = Deno.env.get('UNLOCK_PEPPER') ?? '';

/** No I, O, 0 or 1: a code is read aloud and typed by hand. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const VALID_DAYS = 14;

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

async function send(chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async (request) => {
  if (SECRET && request.headers.get('x-telegram-bot-api-secret-token') !== SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const text: string = message?.text ?? '';
  if (!chatId) return new Response('ok');

  if (chatId !== OWNER_ID) {
    // A customer writing in. Pass it to the owner, who decides and issues.
    const who = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ');
    const handle = message.from?.username ? `@${message.from.username}` : chatId;
    if (OWNER_ID) await send(OWNER_ID, `Հաղորդագրություն ${who} (${handle}):\n\n${text}`);
    await send(
      chatId,
      'Շնորհակալություն։ Ուղարկեք վճարման հաստատումը և ձեր հեռախոսահամարը (+374XXXXXXXX), և մենք կուղարկենք կոդը:',
    );
    return new Response('ok');
  }

  const match = /^\/code\s+(\+374\d{8})(?:\s+(.*))?$/.exec(text.trim());
  if (!match) {
    await send(chatId, 'Կոդ տալու համար՝ /code +374XXXXXXXX [նշում]');
    return new Response('ok');
  }

  const [, phone, note] = match;
  const code = newCode();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { error } = await supabase.from('unlock_codes').insert({
    code_hash: await sha256(`${PEPPER}:${phone}:${code}`),
    phone,
    issued_by: chatId,
    note: note ?? null,
    expires_at: new Date(Date.now() + VALID_DAYS * 86_400_000).toISOString(),
  });

  await send(
    chatId,
    error ? `Չհաջողվեց պահպանել կոդը: ${error.message}` : `${phone} → ${code}\nԺամկետը՝ ${VALID_DAYS} օր:`,
  );
  return new Response('ok');
});
