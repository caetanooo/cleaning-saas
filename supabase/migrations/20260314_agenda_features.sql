-- Agenda Features Migration
-- Feature 1: blocked_dates column stays jsonb but now stores BlockedSlot[]
--   format: [{ "date": "YYYY-MM-DD", "period": "ALL_DAY" | "MORNING" | "AFTERNOON" }]
--   No schema change needed — the jsonb column is flexible.
--
-- Feature 2: Add 'completed' to allowed booking statuses.
-- Feature 3: Add 'source' column to distinguish platform vs manual bookings.
--
-- Run this in Supabase Dashboard → SQL Editor.

-- 1. Drop old status check constraint (if it exists) and recreate with 'completed'
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('confirmed', 'cancelled', 'completed'));

-- 2. Add source column (platform = booked through the app, manual = added by cleaner)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'platform'
    CHECK (source IN ('platform', 'manual'));
