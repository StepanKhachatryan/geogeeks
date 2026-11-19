-- Idram merchant payments.
--
-- Under the static QR a person matched each transfer to a request by the phone
-- number written in its note. The merchant API replaces that with a bill
-- number: every request gets its own, the customer pays that bill on Idram's
-- page, and Idram posts the result back to RESULT_URL. Whoever paid, and from
-- whichever wallet or bank, the bill number says which request it settles.

create sequence if not exists geogeeks.unlock_bill_no start 10001;

-- The price lives here, on the request, and nowhere the browser can touch: an
-- amount taken from the page could be edited down to one dram.
alter table geogeeks.unlock_requests
  add column if not exists bill_no bigint unique default nextval('geogeeks.unlock_bill_no'),
  add column if not exists amount numeric(12, 2) not null default 300.00;

-- Every confirmation Idram sends, kept whole for reconciliation. The
-- transaction id is unique in Idram's system, which makes it the guard against
-- a retried confirmation issuing a second code.
create table if not exists geogeeks.idram_payments (
  trans_id      text primary key,
  bill_no       bigint not null,
  rec_account   text not null,
  payer_account text,
  amount        numeric(12, 2) not null,
  trans_date    text,
  -- issued | already_paid | mismatch | unknown_bill
  outcome       text not null,
  raw           jsonb not null,
  received_at   timestamptz not null default now()
);

create index if not exists idram_payments_bill_idx on geogeeks.idram_payments (bill_no);
alter table geogeeks.idram_payments enable row level security;

-- The bill number and price come back with the token, for the payment form.
drop function if exists public.geogeeks_create_unlock_request(text, text);
create function public.geogeeks_create_unlock_request(p_phone text, p_token text)
returns table(status text, id uuid, bill_no bigint, amount numeric)
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  recent integer;
  created geogeeks.unlock_requests%rowtype;
begin
  select count(*) into recent
  from geogeeks.unlock_requests r
  where r.phone = p_phone and r.created_at > now() - interval '1 hour';

  if recent >= 5 then
    return query select 'rate'::text, null::uuid, null::bigint, null::numeric;
    return;
  end if;

  insert into geogeeks.unlock_requests (token, phone)
  values (p_token, p_phone)
  returning * into created;

  return query select 'ok'::text, created.id, created.bill_no, created.amount;
end;
$$;

-- Idram's first call, before any money moves: is this a bill we issued, still
-- open, for this amount? It carries no checksum, so it decides nothing beyond
-- whether the customer may go on to pay.
create or replace function public.geogeeks_idram_precheck(p_bill_no bigint, p_amount numeric)
returns boolean
language sql
stable
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
  select exists (
    select 1 from geogeeks.unlock_requests r
    where r.bill_no = p_bill_no
      and r.status in ('pending', 'linked')
      and r.amount = p_amount
  );
$$;

-- Idram's second call, after the money has moved. The caller has already
-- checked the checksum; this settles the bill exactly once.
create or replace function public.geogeeks_idram_confirm(
  p_trans_id      text,
  p_bill_no       bigint,
  p_rec_account   text,
  p_payer_account text,
  p_amount        numeric,
  p_trans_date    text,
  p_raw           jsonb,
  p_code          text,
  p_days          integer default 14
) returns table(outcome text, phone text, chat_id text)
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  request record;
  result text;
  claimed integer;
begin
  -- Claim the transaction id first. A concurrent retry blocks on this row and
  -- then finds it taken, so a confirmation can never be processed twice.
  insert into geogeeks.idram_payments
    (trans_id, bill_no, rec_account, payer_account, amount, trans_date, outcome, raw)
  values
    (p_trans_id, p_bill_no, p_rec_account, p_payer_account, p_amount, p_trans_date, 'pending', p_raw)
  on conflict (trans_id) do nothing;

  get diagnostics claimed = row_count;
  if claimed = 0 then
    return query select 'duplicate'::text, null::text, null::text;
    return;
  end if;

  select * into request from geogeeks.unlock_requests r where r.bill_no = p_bill_no for update;

  if not found then
    result := 'unknown_bill';
  elsif request.amount <> p_amount then
    result := 'mismatch';
  elsif request.status = 'approved' then
    -- A second payment for a bill already settled: real money, needs a person.
    result := 'already_paid';
  else
    insert into geogeeks.unlock_codes (code_hash, phone, issued_by, note, expires_at)
    values (
      extensions.crypt(upper(p_code), extensions.gen_salt('bf', 8)),
      request.phone,
      'idram:' || p_trans_id,
      'idram payment',
      now() + make_interval(days => p_days)
    );

    update geogeeks.unlock_requests
    set status = 'approved',
        code = upper(p_code),
        decided_at = now(),
        decided_by = 'idram:' || p_trans_id
    where id = request.id;

    result := 'issued';
  end if;

  update geogeeks.idram_payments set outcome = result where trans_id = p_trans_id;

  return query select result, request.phone, request.chat_id;
end;
$$;

revoke all on function public.geogeeks_create_unlock_request(text, text) from public, anon, authenticated;
revoke all on function public.geogeeks_idram_precheck(bigint, numeric) from public, anon, authenticated;
revoke all on function public.geogeeks_idram_confirm(text, bigint, text, text, numeric, text, jsonb, text, integer)
  from public, anon, authenticated;
grant execute on function public.geogeeks_create_unlock_request(text, text) to service_role;
grant execute on function public.geogeeks_idram_precheck(bigint, numeric) to service_role;
grant execute on function public.geogeeks_idram_confirm(text, bigint, text, text, numeric, text, jsonb, text, integer)
  to service_role;
