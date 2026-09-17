-- Storage and logic for the one-time codes that unlock a converter download.
--
-- Codes are stored as bcrypt hashes, never in the clear, and the comparison
-- happens inside the database. Verification looks a number up first, so only
-- that number's few open codes are ever hashed against.
--
-- The tables live in their own schema so they cannot collide with whatever else
-- the project holds, and because that schema is not exposed to the API they are
-- unreachable from outside. The two entry points sit in `public`, where the API
-- can see them, prefixed by product and callable only by the service role.

create schema if not exists geogeeks;
create extension if not exists pgcrypto with schema extensions;

create table if not exists geogeeks.unlock_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  -- The number the code was issued to, in +374XXXXXXXX form.
  phone text not null,
  -- Telegram id of whoever issued it, for the audit trail.
  issued_by text,
  note text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz
);

create index if not exists unlock_codes_phone_idx
  on geogeeks.unlock_codes (phone, used_at);

-- Attempt log, behind the rate limit and useful for spotting code guessing.
create table if not exists geogeeks.unlock_attempts (
  id bigserial primary key,
  phone text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists unlock_attempts_phone_idx
  on geogeeks.unlock_attempts (phone, created_at desc);

alter table geogeeks.unlock_codes enable row level security;
alter table geogeeks.unlock_attempts enable row level security;

-- Issues a code. Called by the Telegram bot with the service role.
create or replace function public.geogeeks_issue_unlock_code(
  p_phone text,
  p_code text,
  p_issued_by text default null,
  p_note text default null,
  p_days integer default 14
) returns timestamptz
language sql
security definer
set search_path = geogeeks, extensions, pg_temp
as $$
  insert into geogeeks.unlock_codes (code_hash, phone, issued_by, note, expires_at)
  values (
    extensions.crypt(upper(p_code), extensions.gen_salt('bf', 8)),
    p_phone,
    p_issued_by,
    p_note,
    now() + make_interval(days => p_days)
  )
  returning expires_at;
$$;

-- Spends a code. Returns 'ok', 'invalid', 'expired' or 'rate'; a code can win
-- only once, because the update requires used_at to still be empty.
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
        update geogeeks.unlock_attempts set succeeded = true where id = attempt_id;
        return 'ok';
      end if;

      return 'invalid';
    end if;
  end loop;

  return 'invalid';
end;
$$;

-- Only the service role, which lives inside the Edge Functions, may call these.
revoke all on schema geogeeks from anon, authenticated;
revoke all on all tables in schema geogeeks from anon, authenticated;
revoke all on function public.geogeeks_issue_unlock_code(text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.geogeeks_redeem_unlock_code(text, text)
  from public, anon, authenticated;
grant usage on schema geogeeks to service_role;
grant execute on function public.geogeeks_issue_unlock_code(text, text, text, text, integer)
  to service_role;
grant execute on function public.geogeeks_redeem_unlock_code(text, text) to service_role;
