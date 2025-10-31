-- Create waitlist table for Coming Soon signups
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  created_at timestamp with time zone default now()
);

-- Uniqueness to avoid duplicate signups
create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- Allow anonymous inserts from the public website
create policy if not exists "waitlist_public_insert"
on public.waitlist
for insert
to anon, authenticated
using (true)
with check (true);

-- Do not expose rows by default (no SELECT policy)
-- Admins can read via service role outside RLS.

