-- Run this in Supabase SQL Editor to create the table for email verification codes.
-- Used by the API (service role) when users sign up.

create table if not exists public.email_verification_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null
);

-- Optional: restrict access so only the backend (service role) can read/write.
-- Anon key has no access by default if you don't add policies.
alter table public.email_verification_codes enable row level security;

-- No policies: only service role (used by the API) can access this table.
-- If you need to allow something else, add a policy here.
