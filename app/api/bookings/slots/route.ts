import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import {
  getAvailableSlots,
  bookingRowsToBlocks,
  timeToMinutes,
} from "@/lib/timeCalculator";
import type { DayOfWeek, Cleaner, BlockedSlot } from "@/types";

const DAY_NAMES: DayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

/** Supports both legacy string[] and BlockedSlot[] formats. */
function isSlotBlocked(
  raw: (BlockedSlot | string)[],
  date: string,
  period: "MORNING" | "AFTERNOON",
): boolean {
  return raw.some((s) => {
    if (typeof s === "string") return s === date;
    return s.date === date && (s.period === "ALL_DAY" || s.period === period);
  });
}

/**
 * GET /api/bookings/slots?cleanerId=&date=&duration=
 *
 * Returns available start-time slots for a given day, based on:
 * - Cleaner's weekly availability schedule
 * - Blocked dates (ALL_DAY / MORNING / AFTERNOON)
 * - Existing bookings for the day (legacy and dynamic)
 * - Time-of-day cutoff (+45 min buffer from now)
 * - Job duration (in minutes) passed by the caller
 *
 * Response:
 *   {
 *     slots: Array<{ time: string; startMin: number; endMin: number }>,
 *     fallbackToBlocks: boolean   // true if duration=0/missing (legacy mode)
 *   }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId");
  const date      = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!cleanerId || !date) {
    return NextResponse.json(
      { error: "cleanerId and date are required" },
      { status: 400 },
    );
  }

  const durationMin = durationParam ? parseInt(durationParam, 10) : 0;
  if (durationParam && (isNaN(durationMin) || durationMin < 0)) {
    return NextResponse.json({ error: "duration must be a positive integer" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch cleaner
  const { data: cleanerRow, error: cleanerError } = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", cleanerId)
    .single();

  if (cleanerError || !cleanerRow) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  const dayName  = DAY_NAMES[new Date(date + "T00:00:00").getDay()];
  const dayAvail = (cleanerRow.availability as Cleaner["availability"])?.[dayName];

  if (!dayAvail || (!dayAvail.morning && !dayAvail.afternoon)) {
    return NextResponse.json({ slots: [], fallbackToBlocks: false });
  }

  const rawBlocked = (cleanerRow.blocked_dates as (BlockedSlot | string)[]) ?? [];

  // If entire day is blocked, return empty
  const allDayBlocked = rawBlocked.some((s) =>
    typeof s === "string" ? s === date : s.date === date && s.period === "ALL_DAY",
  );
  if (allDayBlocked) {
    return NextResponse.json({ slots: [], fallbackToBlocks: false });
  }

  // Fetch existing bookings
  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("time_block, scheduled_start_at, scheduled_end_at, estimated_duration")
    .eq("cleaner_id", cleanerId)
    .eq("date", date)
    .neq("status", "cancelled");

  const existingBlocks = bookingRowsToBlocks(bookingRows ?? []);

  // Determine work window based on availability + partial blocks
  const morningBlocked   = isSlotBlocked(rawBlocked, date, "MORNING");

  const defaultStart = (dayAvail.morning && !morningBlocked) ? 9 * 60 : 13 * 60 + 30;
  const workStartMin = dayAvail.startTime ? timeToMinutes(dayAvail.startTime) : defaultStart;
  // End of workday: 23:00. The last slot is workEndMin - durationMin,
  // so a 7h job can't start after 16:00 and a 3h job can't start after 20:00.
  const workEndMin   = 23 * 60;

  // If duration not provided, return empty slots + flag fallback
  if (durationMin === 0) {
    return NextResponse.json({ slots: [], fallbackToBlocks: true });
  }

  // Current time cutoff for today
  const now       = new Date();
  const todayStr  = now.toISOString().slice(0, 10);
  const nowMin    = date === todayStr
    ? now.getHours() * 60 + now.getMinutes()
    : -1;

  const slots = getAvailableSlots(
    durationMin,
    existingBlocks,
    workStartMin,
    workEndMin,
    nowMin,
  );

  return NextResponse.json({ slots, fallbackToBlocks: false });
}
