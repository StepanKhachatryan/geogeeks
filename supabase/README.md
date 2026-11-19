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
| Schema | `geogeeks` — `unlock_codes`, `unlock_attempts`, `unlock_requests`, `idram_payments` |
| Issue a code | `public.geogeeks_issue_unlock_code(phone, code, issued_by, note, days)` |
| Spend a code | `public.geogeeks_redeem_unlock_code(phone, code)` |
| Request a code | `public.geogeeks_create_unlock_request`, `_link_`, `_decide_`, `_status_` |
| Tables' extra column | `unlock_requests.code`, the approved code the page collects |
| Called by the page | Edge Functions `geogeeks-request-code`, `geogeeks-verify-unlock` |
| Called by Telegram | Edge Function `geogeeks-telegram-bot` |
| Called by Idram | Edge Function `geogeeks-idram` (via `geogeeks.am/api/idram/*`) |
| Idram's checks | `public.geogeeks_idram_precheck`, `public.geogeeks_idram_confirm` |

Codes are stored as bcrypt hashes and compared inside the database, so neither
the Edge Function nor a copy of the table reveals a code. Both SQL functions are
`security definer` and executable only by the service role: `anon` and
`authenticated` cannot call them, and the schema is not in their search path.

A code is single use, expires after fourteen days, and belongs to one number.
Ten attempts per number in ten minutes stop further tries.

## The flow

0. They load their archive. Send stays disabled until it is there, and says so
   -- a code is single use, and one issued with nothing to convert would be
   spent on nothing. Each disabled button names what it is still waiting for.
1. The customer pays 300 AMD with Idram, by QR or by ID, writing their phone
   number in the payment note so the transfer can be recognised. The page says
   so in a callout of its own, since a transfer with no number on it cannot be
   matched to a request afterwards.
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
be reached without that token. Reopening the page resumes the same request, and
the stored copy is dropped only once the code is spent or refused.

Files are not kept across a reload, so a resumed page has a code and no archive.
It holds the code rather than redeeming it, and says what is missing; loading the
archive is what spends it.

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

## Idram merchant payments

With Idram's merchant keys set, nobody confirms anything by hand:

1. The customer loads the archive, types their number and presses
   "Get a payment bill". `geogeeks-request-code` opens the request, which now
   carries a bill number (`unlock_requests.bill_no`, from 10001) and its price
   (`amount`, 300.00 — set in the database, never taken from the page).
2. The page shows Idram's button: a plain form posting to
   `https://banking.idram.am/Payment/GetPayment` in a new tab, so the archive
   stays loaded in this one.
3. Before any money moves, Idram asks `RESULT_URL` whether the bill is ours,
   still open and for this amount (`EDP_PRECHECK=YES`). Anything but `OK` stops
   the payment.
4. After the transfer, Idram posts the confirmation with `EDP_CHECKSUM`, the MD5
   of `REC_ACCOUNT:AMOUNT:SECRET_KEY:BILL_NO:PAYER_ACCOUNT:TRANS_ID:TRANS_DATE`.
   A matching one mints a code and parks it on the request; the page, polling
   since step 1, fills it in and starts the download. The owner gets a Telegram
   note about each payment.
5. Idram sends the customer to `SUCCESS_URL` or `FAIL_URL`, which return them to
   the converter with a banner saying how it went.

The bill number is what identifies a payment, not the payer: whoever pays it,
from whichever wallet or card, settles that request. Each confirmation is kept
whole in `idram_payments` (without the checksum). Its transaction id is the
primary key and is claimed before anything else, so a retried or concurrent
confirmation cannot issue a second code. A payment that cannot be settled — an
unknown bill, a different amount, a second payment of a paid bill — issues no
code, is recorded, and is put in front of the owner in Telegram.

### The addresses Idram is given

```
SUCCESS_URL  https://geogeeks.am/api/idram/success
FAIL_URL     https://geogeeks.am/api/idram/fail
RESULT_URL   https://geogeeks.am/api/idram/result
EMAIL        geogeeksllc@gmail.com
```

They live on the site's domain and `public/_redirects` proxies them to the Edge
Function, so the backend can move without Idram changing anything.

### Switching it on

Idram returns the merchant's IdramID and secret key. Add both as Edge Function
secrets (Supabase dashboard → Edge Functions → Secrets):

```
IDRAM_REC_ACCOUNT   EDP_REC_ACCOUNT, the merchant IdramID
IDRAM_SECRET_KEY    SECRET_KEY, never committed anywhere
```

That is the switch: `geogeeks-request-code` answers `config` with
`idram: true` once both are set, and the page changes flow on its next load,
with no rebuild. Until then `geogeeks-idram` refuses every call and the manual
flow above stays live. Telegram is no longer needed to approve anything; it
stays as the owner's payment feed, for `/code` by hand, and as the fallback if
the keys are ever removed.

## What this does not do

It is not a security boundary. The conversion happens in the visitor's
browser, so anyone who reads the page source can run it without paying. The gate
makes paying the obvious path; it cannot make it the only one. Moving the
conversion into an Edge Function is the only way to enforce payment, at the cost
of uploading customers' files to a server.
