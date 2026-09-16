# Payment backend

The converter runs in the browser, so this backend does one job: it decides
whether a six-character code is real, unused and issued to the phone number
being used. Nothing about the customer's files passes through it.

## What is here

- `migrations/20260916000000_unlock_codes.sql` — two tables. `unlock_codes`
  keeps only a SHA-256 of `"<pepper>:<phone>:<code>"`, never the code itself, so
  a leaked database still cannot unlock the site. `unlock_attempts` backs the
  rate limit. Row level security is on with no policies, so only the service
  role inside the functions can read either table.
- `functions/verify-unlock` — called by the page. Answers `{ok:true}` once, then
  marks the code used. Ten attempts per number per ten minutes.
- `functions/telegram-bot` — the owner sends `/code +374XXXXXXXX` and gets a
  fresh code back to pass to the customer. Messages from anyone else are
  relayed to the owner, so a customer can send their payment confirmation in
  the same chat.

## Deploying

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase secrets set UNLOCK_PEPPER="<a long random string>"
supabase secrets set TELEGRAM_BOT_TOKEN="<from @BotFather>"
supabase secrets set TELEGRAM_OWNER_ID="<your Telegram numeric id>"
supabase secrets set TELEGRAM_WEBHOOK_SECRET="<another random string>"
supabase secrets set ALLOWED_ORIGIN="https://geogeeks.am"
supabase functions deploy verify-unlock --no-verify-jwt
supabase functions deploy telegram-bot --no-verify-jwt
```

Point Telegram at the bot function once:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<project>.supabase.co/functions/v1/telegram-bot" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

`--no-verify-jwt` is needed because both endpoints are called without a Supabase
session: one by an anonymous visitor, one by Telegram.

## Switching the gate on

Add the Idram QR image at `public/assets/img/payments/idram-qr.png`, then set
these build-time variables on the host (see `.env.example`) and redeploy:

```
NEXT_PUBLIC_PAYMENT_REQUIRED=true
NEXT_PUBLIC_UNLOCK_ENDPOINT=https://<project>.supabase.co/functions/v1/verify-unlock
NEXT_PUBLIC_TELEGRAM_BOT=<bot username without @>
NEXT_PUBLIC_UNLOCK_PRICE=2000 AMD
```

With `NEXT_PUBLIC_PAYMENT_REQUIRED` unset the converter is free and no payment
step is rendered.

## What this does not do

It does not take the payment. Idram is paid by scanning the QR, and the site
never learns that a transfer happened, so a person has to confirm it and issue
the code. An Idram merchant account with a callback URL would close that loop;
until then the Telegram step is the human in the middle.

It is also not a security boundary. The conversion happens in the visitor's
browser, so anyone who reads the page source can run it without paying. The
gate makes paying the obvious path; it cannot make it the only one. Moving the
conversion into an Edge Function is the only way to enforce payment, at the cost
of uploading customers' files to a server.
