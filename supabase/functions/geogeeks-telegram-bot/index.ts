/**
 * Telegram bot for the converter's payment step.
 *
 * A customer pays with Idram, types the number they paid from on the site and
 * presses send. `geogeeks-request-code` puts that request in front of the owner
 * with two buttons; approving mints a code, which the page collects on its own.
 *
 * Telegram is the second way to receive that code, for a customer who followed
 * the deep link: pressing Start binds their chat, and the code is sent there too.
 *
 * `/code +374XXXXXXXX` still issues a code by hand, for a customer who cannot
 * use Telegram.
 *
 * Environment: TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID, TELEGRAM_WEBHOOK_SECRET.
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const OWNER_ID = Deno.env.get('TELEGRAM_OWNER_ID') ?? '';
const SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';

/** No I, O, 0 or 1: a code gets read aloud and typed by hand. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const VALID_DAYS = 14;

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

async function telegram(method: string, payload: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) console.error(method, await response.text());
}

const send = (chatId: string | number, text: string, extra: Record<string, unknown> = {}) =>
  telegram('sendMessage', { chat_id: chatId, text, ...extra });

function client() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

Deno.serve(async (request) => {
  if (SECRET && request.headers.get('x-telegram-bot-api-secret-token') !== SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  if (!TOKEN) return new Response('not configured', { status: 503 });

  const update = await request.json().catch(() => null);
  const supabase = client();

  // The owner tapped Confirm or Reject under a request.
  const callback = update?.callback_query;
  if (callback) {
    const from = callback.from?.id?.toString();
    const [verdict, id] = String(callback.data ?? '').split(':');
    if (from !== OWNER_ID || !id) {
      await telegram('answerCallbackQuery', { callback_query_id: callback.id });
      return new Response('ok');
    }

    const approved = verdict === 'ok';
    const code = approved ? newCode() : null;
    const { data, error } = await supabase.rpc('geogeeks_decide_unlock_request', {
      p_id: id,
      p_approved: approved,
      p_by: from,
      p_code: code,
      p_days: VALID_DAYS,
    });

    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      await telegram('answerCallbackQuery', {
        callback_query_id: callback.id,
        text: error?.message ?? 'Հարցումը չի գտնվել',
      });
      return new Response('ok');
    }

    if (approved && row.chat_id && code) {
      await send(
        row.chat_id,
        `Վճարումը հաստատվեց։\n\nՁեր կոդը՝ ${code}\n\nՄուտքագրեք այն կայքում՝ ֆայլերը ներբեռնելու համար։ Կոդը գործում է ${VALID_DAYS} օր և մեկ անգամ:`,
      );
    } else if (!approved && row.chat_id) {
      await send(
        row.chat_id,
        'Վճարումը չհաստատվեց։ Ստուգեք փոխանցումը կամ գրեք մեզ՝ geogeeksllc@gmail.com',
      );
    }

    await telegram('answerCallbackQuery', {
      callback_query_id: callback.id,
      text: approved ? `Կոդն ուղարկվեց՝ ${code}` : 'Մերժվեց',
    });
    await telegram('editMessageText', {
      chat_id: callback.message.chat.id,
      message_id: callback.message.message_id,
      text: `${callback.message.text}\n\n${approved ? `✅ Հաստատված · ${code}` : '❌ Մերժված'}`,
    });
    return new Response('ok');
  }

  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const text: string = message?.text ?? '';
  if (!chatId) return new Response('ok');

  const who = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ');
  const handle = message.from?.username ? `@${message.from.username}` : chatId;

  // Setup aid: TELEGRAM_OWNER_ID is a numeric chat id, and this is where to read
  // it from without installing another bot to find it.
  if (text.trim() === '/id') {
    await send(chatId, `Chat id: ${chatId}`);
    return new Response('ok');
  }

  // The customer arrived from the site: /start <token> carries their request.
  const start = /^\/start\s+([a-z0-9_-]{8,64})$/i.exec(text.trim());
  if (start) {
    const { data, error } = await supabase.rpc('geogeeks_link_unlock_request', {
      p_token: start[1],
      p_chat_id: chatId,
      p_user: handle,
    });
    const row = Array.isArray(data) ? data[0] : data;

    if (error || !row) {
      await send(chatId, 'Հարցումը չի գտնվել։ Վերադարձեք կայք և փորձեք նորից:');
      return new Response('ok');
    }

    // Decided before the chat was bound, which is the usual case now that the
    // owner is told as soon as the request is opened.
    if (row.status === 'approved') {
      await send(
        chatId,
        row.code
          ? `Վճարումը հաստատված է։\n\nՁեր կոդը՝ ${row.code}\n\nՄուտքագրեք այն կայքում:`
          : 'Այս հարցումն արդեն հաստատված է։ Կոդն ուղարկված է ավելի վաղ:',
      );
      return new Response('ok');
    }
    if (row.status === 'rejected') {
      await send(chatId, 'Այս հարցումը մերժվել է։ Գրեք մեզ՝ geogeeksllc@gmail.com');
      return new Response('ok');
    }

    await send(
      chatId,
      `Ստացանք ձեր հարցումը՝ ${row.phone}։\nՍպասեք՝ վճարումը ստուգվում է, կոդը կուղարկվի այստեղ:`,
    );
    if (OWNER_ID) {
      await send(OWNER_ID, `Հարցում ${row.phone} — Telegram՝ ${who} (${handle})`);
    }
    return new Response('ok');
  }

  if (chatId !== OWNER_ID) {
    if (OWNER_ID) await send(OWNER_ID, `Հաղորդագրություն ${who} (${handle}):\n\n${text}`);
    await send(
      chatId,
      'Բարև։ Կոդ ստանալու համար վճարեք կայքում նշված Idram QR-ով, մուտքագրեք ձեր հեռախոսահամարը և սեղմեք ուղարկել:',
    );
    return new Response('ok');
  }

  // The owner, issuing a code by hand.
  const manual = /^\/code\s+(\+374\d{8})(?:\s+(.*))?$/.exec(text.trim());
  if (!manual) {
    await send(chatId, 'Ձեռքով կոդ տալու համար՝ /code +374XXXXXXXX [նշում]');
    return new Response('ok');
  }

  const [, phone, note] = manual;
  const code = newCode();
  const { data, error } = await supabase.rpc('geogeeks_issue_unlock_code', {
    p_phone: phone,
    p_code: code,
    p_issued_by: chatId,
    p_note: note ?? null,
    p_days: VALID_DAYS,
  });

  await send(
    chatId,
    error
      ? `Չհաջողվեց պահպանել կոդը: ${error.message}`
      : `${phone} → ${code}\nԺամկետը՝ ${new Date(String(data)).toLocaleDateString('hy-AM')}`,
  );
  return new Response('ok');
});
