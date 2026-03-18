-- =============================================================================
-- CleanClick — Database Setup Script
-- =============================================================================
-- Safe to run on a fresh database OR on an existing one.
-- All statements use IF NOT EXISTS / IF EXISTS guards.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================


-- ─── 1. CLEANERS ─────────────────────────────────────────────────────────────
-- One row per cleaner. Linked to auth.users by id.

CREATE TABLE IF NOT EXISTS public.cleaners (
  id                  uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text,
  email               text,
  phone               text,
  messenger_username  text,
  slug                text        UNIQUE,
  availability        jsonb,
  blocked_dates       jsonb       DEFAULT '[]'::jsonb,
  pricing_formula     jsonb,
  frequency_discounts jsonb,
  service_addons      jsonb,
  subscription_status text,
  default_staff_count jsonb       DEFAULT '{"regular":1,"deep":1,"move":1}'::jsonb,
  created_at          timestamptz DEFAULT now()
);

-- Add any columns that might be missing on existing tables
ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS messenger_username  text,
  ADD COLUMN IF NOT EXISTS slug                text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS default_staff_count jsonb DEFAULT '{"regular":1,"deep":1,"move":1}'::jsonb;

-- Unique constraint on slug (safe to add if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cleaners_slug_key' AND conrelid = 'public.cleaners'::regclass
  ) THEN
    ALTER TABLE public.cleaners ADD CONSTRAINT cleaners_slug_key UNIQUE (slug);
  END IF;
END $$;


-- ─── 2. BOOKINGS ─────────────────────────────────────────────────────────────
-- One row per booking session.

CREATE TABLE IF NOT EXISTS public.bookings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name      text        NOT NULL,
  customer_phone     text        NOT NULL,
  customer_address   text        NOT NULL,
  has_pets           boolean     NOT NULL DEFAULT false,
  has_children       boolean     NOT NULL DEFAULT false,
  has_carpet         boolean     NOT NULL DEFAULT false,
  bedrooms           integer     NOT NULL,
  bathrooms          integer     NOT NULL,
  service_type       text        DEFAULT 'regular' CHECK (service_type IN ('regular', 'deep', 'move')),
  frequency          text        NOT NULL CHECK (frequency IN ('one_time', 'weekly', 'biweekly', 'monthly')),
  date               text        NOT NULL,   -- "YYYY-MM-DD"
  time_block         text        NOT NULL CHECK (time_block IN ('morning', 'afternoon')),
  start_time         text,                   -- "09:00" | "13:30"
  end_time           text,                   -- "13:00" | "18:00"
  total_price        numeric     NOT NULL,
  status             text        NOT NULL DEFAULT 'confirmed'
                                CHECK (status IN ('confirmed', 'cancelled', 'completed', 'pending')),
  source             text        NOT NULL DEFAULT 'platform'
                                CHECK (source IN ('platform', 'manual')),
  -- Dynamic scheduling (null for legacy bookings)
  estimated_duration integer,               -- total minutes
  staff_count        integer     DEFAULT 1,
  scheduled_start_at timestamptz,
  scheduled_end_at   timestamptz,
  whatsapp_state     text        CHECK (whatsapp_state IN ('awaiting_acceptance', 'awaiting_team_size')),
  created_at         timestamptz DEFAULT now()
);

-- Add any columns missing on existing tables
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS has_children       boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_carpet         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_type       text        DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS start_time         text,
  ADD COLUMN IF NOT EXISTS end_time           text,
  ADD COLUMN IF NOT EXISTS source             text        NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS estimated_duration integer,
  ADD COLUMN IF NOT EXISTS staff_count        integer     DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_end_at   timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_state     text;

-- Drop and recreate the status check to include all valid values
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'completed', 'pending'));

-- Drop and recreate source check
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('platform', 'manual'));

-- service_type check
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_type_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_service_type_check
  CHECK (service_type IN ('regular', 'deep', 'move'));

-- whatsapp_state check
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_whatsapp_state_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_whatsapp_state_check
  CHECK (whatsapp_state IN ('awaiting_acceptance', 'awaiting_team_size'));

-- Note: no unique index on (cleaner_id, date, time_block) — the dynamic
-- scheduling system allows multiple bookings per day at different times.
-- Overlap prevention is handled at the application level via hasOverlap().


-- ─── 3. CUSTOMER PROFILES ────────────────────────────────────────────────────
-- Stores customer details for auto-fill on repeat bookings.

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text,
  phone        text,
  address      text,
  city         text,
  state        text,
  bedrooms     integer,
  bathrooms    numeric,
  has_pets     boolean     NOT NULL DEFAULT false,
  has_children boolean     NOT NULL DEFAULT false,
  has_carpet   boolean     NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Add columns that may be missing
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS city         text,
  ADD COLUMN IF NOT EXISTS state        text,
  ADD COLUMN IF NOT EXISTS has_children boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_carpet   boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select_own" ON public.customer_profiles;
CREATE POLICY "customers_select_own"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "customers_insert_own" ON public.customer_profiles;
CREATE POLICY "customers_insert_own"
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "customers_update_own" ON public.customer_profiles;
CREATE POLICY "customers_update_own"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = id);


-- ─── 4. PROVIDER TIME CONFIGS ────────────────────────────────────────────────
-- Per-cleaner time configs for dynamic scheduling.

CREATE TABLE IF NOT EXISTS public.provider_time_configs (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type   text    NOT NULL CHECK (service_type IN ('regular', 'deep', 'move')),
  base_duration  integer NOT NULL DEFAULT 120,   -- minutes
  room_type      text    NOT NULL CHECK (room_type IN ('bedroom', 'bathroom', 'kitchen', 'living_room')),
  time_per_room  integer NOT NULL DEFAULT 30,    -- extra minutes per room
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (provider_id, service_type, room_type)
);

-- RLS
ALTER TABLE public.provider_time_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_time_configs_owner_select" ON public.provider_time_configs;
CREATE POLICY "provider_time_configs_owner_select"
  ON public.provider_time_configs FOR SELECT
  USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_insert" ON public.provider_time_configs;
CREATE POLICY "provider_time_configs_owner_insert"
  ON public.provider_time_configs FOR INSERT
  WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_update" ON public.provider_time_configs;
CREATE POLICY "provider_time_configs_owner_update"
  ON public.provider_time_configs FOR UPDATE
  USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_delete" ON public.provider_time_configs;
CREATE POLICY "provider_time_configs_owner_delete"
  ON public.provider_time_configs FOR DELETE
  USING (provider_id = auth.uid());


-- ─── 5. INDEXES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_cleaner_date
  ON public.bookings (cleaner_id, date);

CREATE INDEX IF NOT EXISTS idx_provider_time_configs_provider_service
  ON public.provider_time_configs (provider_id, service_type);


-- =============================================================================
-- Done. All tables, columns, constraints, indexes and RLS policies are up to date.
-- =============================================================================
