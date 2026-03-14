-- Add city and state columns to customer_profiles
-- Run this in the Supabase SQL Editor.

alter table public.customer_profiles
  add column if not exists city  text,
  add column if not exists state text;
