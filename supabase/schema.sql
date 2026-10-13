-- ARUN HACKER Call Intelligence Suite
-- Run the entire file in Supabase Dashboard > SQL Editor > New query > Run.
-- The API uses the service-role key only on the server. Never put that key in public/index.html.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  phone text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, phone)
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.spam_reports (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  category text not null check (category in ('Telemarketing', 'Scam suspected', 'Robocall', 'Unwanted calls')),
  note text not null default '' check (char_length(note) <= 240),
  created_at timestamptz not null default now()
);

create index if not exists favorites_user_created_idx on public.favorites(user_id, created_at desc);
create index if not exists searches_user_created_idx on public.searches(user_id, created_at desc);
create index if not exists searches_phone_idx on public.searches(phone);
create index if not exists spam_reports_phone_idx on public.spam_reports(phone);

-- Keep browser/public access blocked. The Vercel API accesses tables using the
-- SUPABASE_SERVICE_ROLE_KEY environment variable, which bypasses RLS securely server-side.
alter table public.app_users enable row level security;
alter table public.favorites enable row level security;
alter table public.searches enable row level security;
alter table public.spam_reports enable row level security;

revoke all on public.app_users from anon, authenticated;
revoke all on public.favorites from anon, authenticated;
revoke all on public.searches from anon, authenticated;
revoke all on public.spam_reports from anon, authenticated;
