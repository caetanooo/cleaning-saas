-- Migration: Default staff count per service type on cleaners
-- Allows each cleaner to configure how many people they typically send per service type.
-- Used automatically when creating bookings to calculate estimated duration.

ALTER TABLE cleaners
  ADD COLUMN IF NOT EXISTS default_staff_count jsonb
  DEFAULT '{"regular":1,"deep":1,"move":1}'::jsonb;
