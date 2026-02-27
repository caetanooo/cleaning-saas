import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { DayOfWeek, BlockAvailability, Cleaner } from "@/types";

const DAY_NAMES: DayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

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

  // Fetch cleaner availability
  const { data: cleanerRow, error: cleanerError } = await supabase
    .from("cleaners")
    .select("availability, days_off")
    .eq("id", cleanerId)
    .single();
  if (cleanerError || !cleanerRow) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  const dayName  = DAY_NAMES[new Date(date + "T00:00:00").getDay()];
  const dayAvail = (cleanerRow.availability as Cleaner["availability"])[dayName];
  const daysOff  = (cleanerRow.days_off as string[]) ?? [];
  const isDayOff = daysOff.includes(date);

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
    morning:   !isDayOff && dayAvail.morning   && !morningBooked   && !morningPast,
    afternoon: !isDayOff && dayAvail.afternoon && !afternoonBooked && !afternoonPast,
  };

  return NextResponse.json(result);
}
