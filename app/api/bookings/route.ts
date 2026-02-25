import { NextResponse } from "next/server";
import { getBookings, createBooking, isBlockTaken, getCleanerById } from "@/lib/db";
import type { Booking, FrequencyType, TimeBlock } from "@/types";

const BLOCK_TIMES: Record<TimeBlock, { startTime: string; endTime: string }> = {
  morning:   { startTime: "09:00", endTime: "13:00" },
  afternoon: { startTime: "13:30", endTime: "18:00" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId") ?? undefined;
  return NextResponse.json(getBookings(cleanerId));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    cleanerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    hasPets: boolean;
    bedrooms: number;
    bathrooms: number;
    frequency: FrequencyType;
    date: string;
    timeBlock: TimeBlock;
  };

  const cleaner = getCleanerById(body.cleanerId);
  if (!cleaner) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  // Look up price from pricing table
  const key = `${body.bedrooms}-${body.bathrooms}`;
  const basePrice = cleaner.pricingTable[key];
  if (basePrice === undefined) {
    return NextResponse.json({ error: "Invalid bedroom/bathroom combination" }, { status: 400 });
  }

  // Apply frequency discount
  const { frequencyDiscounts } = cleaner;
  const discountPct =
    body.frequency === "weekly"   ? frequencyDiscounts.weekly   :
    body.frequency === "biweekly" ? frequencyDiscounts.biweekly :
    body.frequency === "monthly"  ? frequencyDiscounts.monthly  : 0;
  const totalPrice = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;

  // Re-validate block availability (race condition guard)
  if (isBlockTaken(body.cleanerId, body.date, body.timeBlock)) {
    return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
  }

  const { startTime, endTime } = BLOCK_TIMES[body.timeBlock];

  const booking: Booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cleanerId: body.cleanerId,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    hasPets: body.hasPets,
    bedrooms: body.bedrooms,
    bathrooms: body.bathrooms,
    frequency: body.frequency,
    date: body.date,
    timeBlock: body.timeBlock,
    startTime,
    endTime,
    totalPrice,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  createBooking(booking);
  return NextResponse.json(booking, { status: 201 });
}
