/**
 * lib/timeCalculator.ts
 *
 * Pure functions for dynamic scheduling calculations.
 * No side effects — safe to import in tests and edge functions.
 */

import type { DurationInput, RoomType } from "@/types";

/** Travel buffer added on each side of a booking for overlap detection (minutes). */
export const TRAVEL_TIME_MINUTES = 45;

/** Granularity of candidate slots (minutes). */
export const SLOT_STEP_MINUTES = 30;

/** Default work window start (minutes from midnight). */
export const DEFAULT_WORK_START_MINUTES = 9 * 60;   // 09:00

/** Default work window end (minutes from midnight). */
export const DEFAULT_WORK_END_MINUTES = 23 * 60;    // 23:00

// ─── Duration Calculation ────────────────────────────────────────────────────

/**
 * Calculates total estimated duration in minutes for a booking.
 *
 * Formula: T_total = (T_base + Σ(count × T_room)) / N_staff
 *
 * If no time configs exist for the service type, returns null (fallback to legacy).
 */
export function calculateDuration(input: DurationInput): number | null {
  const { serviceType, bedrooms, bathrooms, kitchens = 0, livingRooms = 0, staffCount, timeConfigs } = input;

  const serviceConfigs = timeConfigs.filter((c) => c.serviceType === serviceType);
  if (serviceConfigs.length === 0) return null;

  // Base duration: use the first config's baseDuration (same for all room types within a service)
  const baseDuration = serviceConfigs[0].baseDuration;

  // Map rooms to their counts
  const roomCounts: Record<RoomType, number> = {
    bedroom:     bedrooms,
    bathroom:    bathrooms,
    kitchen:     kitchens,
    living_room: livingRooms,
  };

  // Sum extra time per room type
  const roomExtra = serviceConfigs.reduce((sum, config) => {
    const count = roomCounts[config.roomType] ?? 0;
    return sum + count * config.timePerRoom;
  }, 0);

  const rawDuration = baseDuration + roomExtra;
  const effectiveStaff = Math.max(1, staffCount);
  return Math.ceil(rawDuration / effectiveStaff);
}

// ─── Overlap Detection ───────────────────────────────────────────────────────

export interface ScheduledBlock {
  /** ISO string or "HH:MM" */
  startAt: string;
  /** ISO string or "HH:MM" */
  endAt: string;
  /** Date string "YYYY-MM-DD" (required when startAt/endAt are "HH:MM") */
  date?: string;
}

/**
 * Checks whether a candidate slot [start, start+duration] overlaps with any
 * existing booking block, after padding each side with TRAVEL_TIME_MINUTES.
 *
 * All times are expressed as minutes-from-midnight for a single day.
 */
export function hasOverlap(
  candidateStartMin: number,
  durationMin: number,
  existingBlocks: Array<{ startMin: number; endMin: number }>,
): boolean {
  const candidateEnd = candidateStartMin + durationMin;

  for (const block of existingBlocks) {
    // Pad the existing block with travel time on both sides
    const blockStart = block.startMin - TRAVEL_TIME_MINUTES;
    const blockEnd   = block.endMin   + TRAVEL_TIME_MINUTES;

    // Overlap check: two intervals [a,b] and [c,d] overlap when a < d && c < b
    if (candidateStartMin < blockEnd && blockStart < candidateEnd) {
      return true;
    }
  }
  return false;
}

// ─── Slot Generation ─────────────────────────────────────────────────────────

export interface TimeSlotOption {
  /** Start time as "HH:MM" string */
  time: string;
  /** Start time as minutes-from-midnight */
  startMin: number;
  /** End time as minutes-from-midnight */
  endMin: number;
}

/**
 * Converts "HH:MM" string to minutes from midnight.
 */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to "HH:MM" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Returns available start-time slots for a given day.
 *
 * @param durationMin          - Estimated job duration in minutes (including no travel — travel is added in overlap check)
 * @param existingBookingBlocks - Active bookings for that day as { startMin, endMin }
 * @param workStartMin          - Work window start (default 09:00 = 540)
 * @param workEndMin            - Work window end   (default 18:00 = 1080)
 * @param nowMin                - Current time in minutes (for today's cutoff); -1 = no cutoff
 * @returns Array of available slot options
 */
export function getAvailableSlots(
  durationMin: number,
  existingBookingBlocks: Array<{ startMin: number; endMin: number }>,
  workStartMin = DEFAULT_WORK_START_MINUTES,
  workEndMin   = DEFAULT_WORK_END_MINUTES,
  nowMin       = -1,
): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];
  const cutoff = nowMin >= 0 ? nowMin + TRAVEL_TIME_MINUTES : -1;

  for (let start = workStartMin; start + durationMin <= workEndMin; start += SLOT_STEP_MINUTES) {
    // Skip past slots when scheduling for today
    if (cutoff >= 0 && start <= cutoff) continue;

    if (!hasOverlap(start, durationMin, existingBookingBlocks)) {
      slots.push({
        time:     minutesToTime(start),
        startMin: start,
        endMin:   start + durationMin,
      });
    }
  }

  return slots;
}

/**
 * Converts a booking's legacy time_block to a { startMin, endMin } block.
 * Used for overlap detection against bookings that don't have scheduled_start_at.
 */
export function legacyBlockToMinutes(
  timeBlock: "morning" | "afternoon",
): { startMin: number; endMin: number } {
  return timeBlock === "morning"
    ? { startMin: 9  * 60,      endMin: 13 * 60 }
    : { startMin: 13 * 60 + 30, endMin: 18 * 60 };
}

/**
 * Builds a list of booking blocks from DB rows, supporting both legacy
 * (time_block string) and dynamic (scheduled_start_at / scheduled_end_at) formats.
 */
export function bookingRowsToBlocks(
  rows: Array<{
    time_block?: string | null;
    scheduled_start_at?: string | null;
    scheduled_end_at?: string | null;
    estimated_duration?: number | null;
  }>,
): Array<{ startMin: number; endMin: number }> {
  return rows.map((row) => {
    if (row.scheduled_start_at && row.scheduled_end_at) {
      const startDate = new Date(row.scheduled_start_at);
      const endDate   = new Date(row.scheduled_end_at);
      return {
        startMin: startDate.getHours() * 60 + startDate.getMinutes(),
        endMin:   endDate.getHours()   * 60 + endDate.getMinutes(),
      };
    }
    // Fallback to legacy time_block
    return legacyBlockToMinutes((row.time_block ?? "morning") as "morning" | "afternoon");
  });
}
