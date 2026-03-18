-- Migration: Dynamic Scheduling
-- Adds provider_time_configs table and new columns to bookings

-- ─── 1. provider_time_configs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_time_configs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type    text NOT NULL CHECK (service_type IN ('regular', 'deep', 'move')),
  base_duration   integer NOT NULL DEFAULT 120,  -- minutes, base for this service type
  room_type       text NOT NULL CHECK (room_type IN ('bedroom', 'bathroom', 'kitchen', 'living_room')),
  time_per_room   integer NOT NULL DEFAULT 30,   -- extra minutes per unit of this room type
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (provider_id, service_type, room_type)
);

-- RLS: each provider can only read/write their own configs
ALTER TABLE provider_time_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_time_configs_owner_select" ON provider_time_configs;
CREATE POLICY "provider_time_configs_owner_select"
  ON provider_time_configs FOR SELECT
  USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_insert" ON provider_time_configs;
CREATE POLICY "provider_time_configs_owner_insert"
  ON provider_time_configs FOR INSERT
  WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_update" ON provider_time_configs;
CREATE POLICY "provider_time_configs_owner_update"
  ON provider_time_configs FOR UPDATE
  USING (provider_id = auth.uid());

DROP POLICY IF EXISTS "provider_time_configs_owner_delete" ON provider_time_configs;
CREATE POLICY "provider_time_configs_owner_delete"
  ON provider_time_configs FOR DELETE
  USING (provider_id = auth.uid());

-- ─── 2. bookings — new columns ────────────────────────────────────────────────

-- Estimated duration in minutes (calculated at booking time)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS estimated_duration integer;

-- Number of staff attending (1 = solo, 2 = duo, 3 = trio)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS staff_count integer DEFAULT 1;

-- Precise start/end timestamps (for dynamic scheduling; null for legacy bookings)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS scheduled_end_at timestamptz;

-- ─── 3. bookings — add 'pending' status ──────────────────────────────────────
-- Drop and recreate the CHECK constraint to include 'pending'
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- ─── 4. Service role read access for provider_time_configs ───────────────────
-- Allow the service role (used in API routes) to bypass RLS
-- (Service role bypasses RLS by default — no extra policy needed)

-- ─── 5. whatsapp_state — tracks conversation phase for cleaner confirmation flow ─
-- NULL = no active WA conversation | 'awaiting_acceptance' | 'awaiting_team_size'
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS whatsapp_state text
  CHECK (whatsapp_state IN ('awaiting_acceptance', 'awaiting_team_size'));

-- ─── 6. Index for fast lookup ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_provider_time_configs_provider_service
  ON provider_time_configs (provider_id, service_type);
