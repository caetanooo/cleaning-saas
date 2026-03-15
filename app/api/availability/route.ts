import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { DayOfWeek, BlockAvailability, Cleaner, BlockedSlot } from "@/types";

const DAY_NAMES: DayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

/** Supports both legacy string[] and new BlockedSlot[] formats in blocked_dates. */
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId");
  const date      = searchParams.get("date");

  if (!cleanerId || !date) {
    return NextResponse.json(
      { error: "cleanerId and date are required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: cleanerRow, error: cleanerError } = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", cleanerId)
    .single();
  if (cleanerError || !cleanerRow) {
    console.error("[availability] cleaner fetch failed:", cleanerError?.message, "id:", cleanerId);
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  const dayName  = DAY_NAMES[new Date(date + "T00:00:00").getDay()];
  const dayAvail = (cleanerRow.availability as Cleaner["availability"])?.[dayName];
  if (!dayAvail) {
    console.error("[availability] dayAvail missing for", dayName, "availability:", cleanerRow.availability);
    return NextResponse.json({ morning: false, afternoon: false });
  }

  const rawBlocked = (cleanerRow.blocked_dates as (BlockedSlot | string)[]) ?? [];
  const morningBlocked   = isSlotBlocked(rawBlocked, date, "MORNING");
  const afternoonBlocked = isSlotBlocked(rawBlocked, date, "AFTERNOON");

  // Fetch existing bookings for this date
  const { data: bookings } = await supabase
    .from("bookings")
    .select("time_block")
    .eq("cleaner_id", cleanerId)
    .eq("date", date)
    .neq("status", "cancelled");

  const morningBooked   = bookings?.some((b) => b.time_block === "morning")   ?? false;
  const afternoonBooked = bookings?.some((b) => b.time_block === "afternoon") ?? false;

  // Filter out past blocks for today (+ 30 min buffer)
  const now           = new Date();
  const todayStr      = now.toISOString().slice(0, 10);
  const nowMinutes    = now.getHours() * 60 + now.getMinutes() + 30;
  const morningPast   = date === todayStr && nowMinutes >= 13 * 60;
  const afternoonPast = date === todayStr && nowMinutes >= 18 * 60;

  const result: BlockAvailability = {
    morning:   !morningBlocked   && dayAvail.morning   && !morningBooked   && !morningPast,
    afternoon: !afternoonBlocked && dayAvail.afternoon && !afternoonBooked && !afternoonPast,
  };

  return NextResponse.json(result);
}
