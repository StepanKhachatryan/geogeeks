# Payment backend

The converter runs in the browser, so this backend does one job: it decides
whether a six-character code is real, unused and issued to the number using it.
Nothing about a customer's files passes through it.

## What is deployed

It lives inside the **fip-armenia** project (`mejjprejtcyoyfoiocrq`), because a
free Supabase plan allows two active projects and both slots were taken. The
tables sit in their own `geogeeks` schema, which the API does not expose, so
they cannot collide with or be reached through that project's own data.

| Piece | Name |
| --- | --- |
| Schema | `geogeeks` — `unlock_codes`, `unlock_attempts`, `unlock_requests` |
| Issue a code | `public.geogeeks_issue_unlock_code(phone, code, issued_by, note, days)` |
| Spend a code | `public.geogeeks_redeem_unlock_code(phone, code)` |
| Request a code | `public.geogeeks_create_unlock_request`, `_link_`, `_decide_`, `_status_` |
| Tables' extra column | `unlock_requests.code`, the approved code the page collects |
| Called by the page | Edge Functions `geogeeks-request-code`, `geogeeks-verify-unlock` |
| Called by Telegram | Edge Function `geogeeks-telegram-bot` |

Codes are stored as bcrypt hashes and compared inside the database, so neither
the Edge Function nor a copy of the table reveals a code. Both SQL functions are
`security definer` and executable only by the service role: `anon` and
`authenticated` cannot call them, and the schema is not in their search path.

A code is single use, expires after fourteen days, and belongs to one number.
Ten attempts per number in ten minutes stop further tries.

## The flow

1. The customer pays 300 AMD with Idram, by QR or by ID, writing their phone
   number in the payment note so the transfer can be recognised.
2. They type that number on the page and press send.
3. `geogeeks-request-code` stores the request and puts it in front of the owner
   in Telegram, with Confirm and Reject under it.
4. The owner checks the Idram transfer and taps one. Confirming mints a code,
   binds it to the number and parks it on the request row.
5. The page, which has been polling since step 2, collects the code, fills it in
   and starts the download.

Step 4 is a person looking at a phone, so the page promises an answer within 30
minutes rather than within a few, polls for 35, and keeps the request's token in
`localStorage`: half an hour is long enough to close the tab, and the code cannot
be reached without that token. Reopening the page resumes the same request.

Nothing is asked of the customer's device: cadastre work is done at a desk and
Telegram usually lives on a phone, so requiring it there would have meant a
device switch in the middle of paying. A customer who would rather have the code
in Telegram as well can follow the deep link offered while they wait; pressing
Start binds their chat and the bot sends it there too.

The code on the request row is the one thing stored in the clear -- `unlock_codes`
only ever holds a bcrypt hash. It is readable solely by presenting the request's
20-character token, which only that browser has, and it is wiped the moment the
code is spent.

## Setting the Telegram side up

Without `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OWNER_ID` a request is stored but
nobody is told about it, and the page says to send the confirmation by email
instead. In the Supabase dashboard, under Edge Functions → Secrets, add:

```
TELEGRAM_BOT_TOKEN      from @BotFather
TELEGRAM_BOT_USERNAME   the bot's @name without the @, used to build the deep link
TELEGRAM_WEBHOOK_SECRET any long random string
```

Then point Telegram at the function once:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://mejjprejtcyoyfoiocrq.supabase.co/functions/v1/geogeeks-telegram-bot" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

The fourth secret needs the bot to be answering first. Send it `/id`; it replies
with the numeric chat id, which is what `TELEGRAM_OWNER_ID` wants:

```
TELEGRAM_OWNER_ID       your own Telegram numeric id, from /id in the bot
```

A bot created in BotFather and left untouched is enough: it has no logic of its
own, and everything it does lives in this Edge Function. Without the secrets it
simply answers nothing.

Until that is done the page tells customers to send their confirmation by email,
and codes are issued from the SQL editor or with `/code` in the bot:

```sql
select public.geogeeks_issue_unlock_code('+374XXXXXXXX', 'ABC123', 'manual', null, 14);
```

## Turning the gate off

The page is paid by default. `NEXT_PUBLIC_PAYMENT_REQUIRED=false` at build time
makes the converter free again; `NEXT_PUBLIC_UNLOCK_ENDPOINT` overrides the
verifier URL baked into `src/lib/unlock.ts`.

## What this does not do

It does not take the payment. Idram is paid by scanning the QR, and the site
never learns that a transfer happened, so a person confirms it and issues the
code. An Idram merchant account with a callback URL would close that loop.

It is also not a security boundary. The conversion happens in the visitor's
browser, so anyone who reads the page source can run it without paying. The gate
makes paying the obvious path; it cannot make it the only one. Moving the
conversion into an Edge Function is the only way to enforce payment, at the cost
of uploading customers' files to a server.
