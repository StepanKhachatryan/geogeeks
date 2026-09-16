-- Storage for the one-time codes that unlock a converter download.
--
-- Codes are never stored in the clear: the row keeps a SHA-256 of
-- "<pepper>:<phone>:<code>", so a leaked table still cannot be used against the
-- site without the pepper held by the Edge Functions.

create extension if not exists pgcrypto;

create table if not exists public.unlock_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  -- The number the code was issued to, in +374XXXXXXXX form.
  phone text not null,
  -- Telegram id of whoever issued it, for the audit trail.
  issued_by text,
  note text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz
);

create index if not exists unlock_codes_phone_idx on public.unlock_codes (phone);

-- Attempt log, used for rate limiting and for spotting code guessing.
create table if not exists public.unlock_attempts (
  id bigserial primary key,
  phone text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists unlock_attempts_phone_idx
  on public.unlock_attempts (phone, created_at desc);

-- Row level security with no policies at all: neither the anon key nor an
-- authenticated user can read or write these tables. Only the service role,
-- which lives inside the Edge Functions, can touch them.
alter table public.unlock_codes enable row level security;
alter table public.unlock_attempts enable row level security;
