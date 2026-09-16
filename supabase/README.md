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
| Schema | `geogeeks` — `unlock_codes`, `unlock_attempts` |
| Issue a code | `public.geogeeks_issue_unlock_code(phone, code, issued_by, note, days)` |
| Spend a code | `public.geogeeks_redeem_unlock_code(phone, code)` |
| Called by the page | Edge Function `geogeeks-verify-unlock` |
| Called by Telegram | Edge Function `geogeeks-telegram-bot` |

Codes are stored as bcrypt hashes and compared inside the database, so neither
the Edge Function nor a copy of the table reveals a code. Both SQL functions are
`security definer` and executable only by the service role: `anon` and
`authenticated` cannot call them, and the schema is not in their search path.

A code is single use, expires after fourteen days, and belongs to one number.
Ten attempts per number in ten minutes stop further tries.

## Still to do

The Telegram bot is deployed but idle until its secrets exist. In the Supabase
dashboard, under Edge Functions → Secrets, add:

```
TELEGRAM_BOT_TOKEN      from @BotFather
TELEGRAM_OWNER_ID       your own Telegram numeric id, from @userinfobot
TELEGRAM_WEBHOOK_SECRET any long random string
```

Then point Telegram at the function once:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://mejjprejtcyoyfoiocrq.supabase.co/functions/v1/geogeeks-telegram-bot" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Until that is done, codes are issued by hand from the SQL editor:

```sql
select public.geogeeks_issue_unlock_code('+374XXXXXXXX', 'ABC123', 'manual', null, 14);
```

Set `NEXT_PUBLIC_TELEGRAM_BOT` to the bot username once it exists, and the page
swaps its email line for a Telegram button.

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
