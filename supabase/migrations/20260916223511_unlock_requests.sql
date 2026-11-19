-- A request is what a customer sends after paying: "this number paid, please
-- confirm". The owner approves it in Telegram, and approval is what mints the
-- code. The token is the customer's proof of being the one who asked.
--
-- Recovered from the live database: it was applied there directly and never
-- written down, so a fresh setup from these files would have stopped at the
-- next migration, which alters this table.

create table if not exists geogeeks.unlock_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  phone text not null,
  status text not null default 'pending'
    check (status in ('pending', 'linked', 'approved', 'rejected')),
  -- Filled when the customer opens the bot, and the only way to reach them.
  chat_id text,
  telegram_user text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);

create index if not exists unlock_requests_phone_idx
  on geogeeks.unlock_requests (phone, created_at desc);
create index if not exists unlock_requests_status_idx
  on geogeeks.unlock_requests (status, created_at desc);

alter table geogeeks.unlock_requests enable row level security;

-- Opens a request. Returns 'rate' when the number has asked too often, so the
-- owner's Telegram cannot be flooded from the page.
create or replace function public.geogeeks_create_unlock_request(p_phone text, p_token text)
returns text
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  recent integer;
begin
  select count(*) into recent
  from geogeeks.unlock_requests
  where phone = p_phone and created_at > now() - interval '1 hour';

  if recent >= 5 then
    return 'rate';
  end if;

  insert into geogeeks.unlock_requests (token, phone) values (p_token, p_phone);
  return 'ok';
end;
$$;

-- The customer opened the bot: bind the chat so the code has somewhere to go.
create or replace function public.geogeeks_link_unlock_request(
  p_token text,
  p_chat_id text,
  p_user text
) returns table (id uuid, phone text, status text)
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
begin
  return query
  update geogeeks.unlock_requests r
  set chat_id = p_chat_id,
      telegram_user = p_user,
      status = case when r.status = 'pending' then 'linked' else r.status end
  where r.token = p_token
  returning r.id, r.phone, r.status;
end;
$$;

-- The owner decided. Approval stores the code, bound to the same number.
create or replace function public.geogeeks_decide_unlock_request(
  p_id uuid,
  p_approved boolean,
  p_by text,
  p_code text default null,
  p_days integer default 14
) returns table (phone text, chat_id text, status text)
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  request record;
begin
  select * into request from geogeeks.unlock_requests where id = p_id;
  if not found then
    return;
  end if;

  if request.status in ('approved', 'rejected') then
    return query select request.phone, request.chat_id, request.status;
    return;
  end if;

  if p_approved then
    insert into geogeeks.unlock_codes (code_hash, phone, issued_by, note, expires_at)
    values (
      extensions.crypt(upper(p_code), extensions.gen_salt('bf', 8)),
      request.phone,
      p_by,
      'telegram approval',
      now() + make_interval(days => p_days)
    );
  end if;

  update geogeeks.unlock_requests
  set status = case when p_approved then 'approved' else 'rejected' end,
      decided_at = now(),
      decided_by = p_by
  where id = p_id;

  return query
  select request.phone, request.chat_id, case when p_approved then 'approved' else 'rejected' end;
end;
$$;

-- What the page polls while the customer waits.
create or replace function public.geogeeks_unlock_request_status(p_token text)
returns text
language sql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
  select status from geogeeks.unlock_requests where token = p_token;
$$;

revoke all on function public.geogeeks_create_unlock_request(text, text) from public, anon, authenticated;
revoke all on function public.geogeeks_link_unlock_request(text, text, text) from public, anon, authenticated;
revoke all on function public.geogeeks_decide_unlock_request(uuid, boolean, text, text, integer) from public, anon, authenticated;
revoke all on function public.geogeeks_unlock_request_status(text) from public, anon, authenticated;
grant execute on function public.geogeeks_create_unlock_request(text, text) to service_role;
grant execute on function public.geogeeks_link_unlock_request(text, text, text) to service_role;
grant execute on function public.geogeeks_decide_unlock_request(uuid, boolean, text, text, integer) to service_role;
grant execute on function public.geogeeks_unlock_request_status(text) to service_role;
