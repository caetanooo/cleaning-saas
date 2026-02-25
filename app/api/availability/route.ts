import { NextResponse } from "next/server";
import { getCleanerById, getBookings } from "@/lib/db";
import type { DayOfWeek, BlockAvailability } from "@/types";

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

  const cleaner = getCleanerById(cleanerId);
  if (!cleaner) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  const dateObj = new Date(date + "T00:00:00");
  const dayName = DAY_NAMES[dateObj.getDay()];
  const dayAvail = cleaner.availability[dayName];

  // Check existing bookings for this date
  const bookings = getBookings(cleanerId).filter(
    (b) => b.date === date && b.status !== "cancelled",
  );
  const morningBooked   = bookings.some((b) => b.timeBlock === "morning");
  const afternoonBooked = bookings.some((b) => b.timeBlock === "afternoon");

  // For today: filter out blocks that have already passed (+ 30 min buffer)
  const now = new Date();
  const todayStr    = now.toISOString().slice(0, 10);
  const nowMinutes  = now.getHours() * 60 + now.getMinutes() + 30;
  const morningPast   = date === todayStr && nowMinutes >= 13 * 60;       // 13:00
  const afternoonPast = date === todayStr && nowMinutes >= 18 * 60;       // 18:00

  const result: BlockAvailability = {
    morning:   dayAvail.morning   && !morningBooked   && !morningPast,
    afternoon: dayAvail.afternoon && !afternoonBooked && !afternoonPast,
  };

  return NextResponse.json(result);
}
