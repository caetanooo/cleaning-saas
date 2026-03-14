-- Customer profiles table
-- Stores recurring booking details linked to auth.users.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists public.customer_profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  name         text,
  phone        text,
  address      text,
  bedrooms     integer,
  bathrooms    numeric,
  has_pets     boolean     not null default false,
  has_children boolean     not null default false,
  has_carpet   boolean     not null default false,
  updated_at   timestamptz not null default now()
);

-- Row Level Security: only the customer themselves can read/write their own row.
alter table public.customer_profiles enable row level security;

create policy "customers_select_own"
  on public.customer_profiles for select
  using (auth.uid() = id);

create policy "customers_insert_own"
  on public.customer_profiles for insert
  with check (auth.uid() = id);

create policy "customers_update_own"
  on public.customer_profiles for update
  using (auth.uid() = id);
