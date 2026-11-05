-- The code now reaches the customer on the page, not only through Telegram.
--
-- Cadastre work happens on a desktop and Telegram usually lives on a phone, so
-- asking the customer to open the bot before the request could even be sent cost
-- them a device switch. The request now goes straight to the owner, and the page
-- picks the code up by polling the token it already holds.
--
-- The code is kept on the request row in the clear, unlike `unlock_codes`, which
-- only ever holds a bcrypt hash. It is readable solely by whoever presents the
-- request's 20-character token -- the browser that opened it -- and it is wiped
-- as soon as the code is spent.

alter table geogeeks.unlock_requests add column if not exists code text;

-- Returns the new row's id as well, so the caller can offer Confirm and Reject
-- without waiting for the customer to bind a Telegram chat.
drop function if exists public.geogeeks_create_unlock_request(text, text);
create function public.geogeeks_create_unlock_request(p_phone text, p_token text)
returns table(status text, id uuid)
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  recent integer;
  new_id uuid;
begin
  select count(*) into recent
  from geogeeks.unlock_requests r
  where r.phone = p_phone and r.created_at > now() - interval '1 hour';

  if recent >= 5 then
    return query select 'rate'::text, null::uuid;
    return;
  end if;

  insert into geogeeks.unlock_requests (token, phone)
  values (p_token, p_phone)
  returning unlock_requests.id into new_id;

  return query select 'ok'::text, new_id;
end;
$$;

-- Approving now also parks the code on the request, for the page to collect.
create or replace function public.geogeeks_decide_unlock_request(
  p_id uuid,
  p_approved boolean,
  p_by text,
  p_code text default null,
  p_days integer default 14
) returns table(phone text, chat_id text, status text)
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
      code = case when p_approved then upper(p_code) else null end,
      decided_at = now(),
      decided_by = p_by
  where id = p_id;

  return query
  select request.phone, request.chat_id, case when p_approved then 'approved' else 'rejected' end;
end;
$$;

-- The page polls this. Once approved it carries the code itself.
drop function if exists public.geogeeks_unlock_request_status(text);
create function public.geogeeks_unlock_request_status(p_token text)
returns table(status text, code text)
language sql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
  select r.status, r.code from geogeeks.unlock_requests r where r.token = p_token;
$$;

-- A spent code is of no further use to anyone, so stop keeping a readable copy.
create or replace function public.geogeeks_redeem_unlock_code(p_phone text, p_code text)
returns text
language plpgsql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
declare
  attempt_id bigint;
  recent integer;
  candidate record;
  claimed integer;
begin
  select count(*) into recent
  from geogeeks.unlock_attempts
  where phone = p_phone and created_at > now() - interval '10 minutes';

  if recent >= 10 then
    return 'rate';
  end if;

  insert into geogeeks.unlock_attempts (phone) values (p_phone) returning id into attempt_id;

  for candidate in
    select * from geogeeks.unlock_codes
    where phone = p_phone and used_at is null
    order by created_at desc
  loop
    if candidate.code_hash = extensions.crypt(upper(p_code), candidate.code_hash) then
      if candidate.expires_at < now() then
        return 'expired';
      end if;

      update geogeeks.unlock_codes
      set used_at = now()
      where id = candidate.id and used_at is null;

      get diagnostics claimed = row_count;
      if claimed = 1 then
        update geogeeks.unlock_requests
        set code = null
        where phone = p_phone and code = upper(p_code);

        update geogeeks.unlock_attempts set succeeded = true where id = attempt_id;
        return 'ok';
      end if;

      return 'invalid';
    end if;
  end loop;

  return 'invalid';
end;
$$;

revoke all on function public.geogeeks_create_unlock_request(text, text)
  from public, anon, authenticated;
revoke all on function public.geogeeks_unlock_request_status(text)
  from public, anon, authenticated;
grant execute on function public.geogeeks_create_unlock_request(text, text) to service_role;
grant execute on function public.geogeeks_unlock_request_status(text) to service_role;

-- A customer who follows the deep link after the decision still gets the code,
-- so the link function hands it over too.
drop function if exists public.geogeeks_link_unlock_request(text, text, text);
create function public.geogeeks_link_unlock_request(p_token text, p_chat_id text, p_user text)
returns table(id uuid, phone text, status text, code text)
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
  returning r.id, r.phone, r.status, r.code;
end;
$$;

revoke all on function public.geogeeks_link_unlock_request(text, text, text)
  from public, anon, authenticated;
grant execute on function public.geogeeks_link_unlock_request(text, text, text) to service_role;
