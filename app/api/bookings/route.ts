import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Booking, FrequencyType, TimeBlock, CleaningServiceType, PricingFormula, FrequencyDiscounts, ServiceAddons } from "@/types";

const BLOCK_TIMES: Record<TimeBlock, { startTime: string; endTime: string }> = {
  morning:   { startTime: "09:00", endTime: "13:00" },
  afternoon: { startTime: "13:30", endTime: "18:00" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId");
  if (!cleanerId) return NextResponse.json({ error: "cleanerId required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("cleaner_id", cleanerId)
    .order("date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
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
    serviceType?: CleaningServiceType;
    frequency: FrequencyType;
    date: string;
    timeBlock: TimeBlock;
  };

  const supabase = createServiceClient();

  // Fetch cleaner pricing
  const { data: cleanerRow, error: cleanerError } = await supabase
    .from("cleaners")
    .select("pricing_formula, service_addons, frequency_discounts")
    .eq("id", body.cleanerId)
    .single();
  if (cleanerError || !cleanerRow) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  const formula: PricingFormula = (cleanerRow.pricing_formula as PricingFormula) ?? {
    base: 90, extraPerBedroom: 20, extraPerBathroom: 15,
  };
  const addons: ServiceAddons = (cleanerRow.service_addons as ServiceAddons) ?? {
    deep: 50, move: 80,
  };
  const frequencyDiscounts = cleanerRow.frequency_discounts as FrequencyDiscounts;

  const baseTotal =
    formula.base +
    (body.bedrooms  - 1) * formula.extraPerBedroom +
    (body.bathrooms - 1) * formula.extraPerBathroom;
  const addon =
    body.serviceType === "deep" ? (addons.deep ?? 0) :
    body.serviceType === "move" ? (addons.move ?? 0) : 0;
  const subtotal = baseTotal + addon;

  const discountPct =
    body.frequency === "weekly"   ? frequencyDiscounts.weekly   :
    body.frequency === "biweekly" ? frequencyDiscounts.biweekly :
    body.frequency === "monthly"  ? frequencyDiscounts.monthly  : 0;
  const totalPrice = Math.round(subtotal * (1 - discountPct / 100) * 100) / 100;

  // Race-condition guard: check if block is still available
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("cleaner_id", body.cleanerId)
    .eq("date", body.date)
    .eq("time_block", body.timeBlock)
    .neq("status", "cancelled")
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
  }

  const { startTime, endTime } = BLOCK_TIMES[body.timeBlock];

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      cleaner_id:       body.cleanerId,
      customer_name:    body.customerName,
      customer_phone:   body.customerPhone,
      customer_address: body.customerAddress,
      has_pets:         body.hasPets,
      bedrooms:         body.bedrooms,
      bathrooms:        body.bathrooms,
      frequency:        body.frequency,
      date:             body.date,
      time_block:       body.timeBlock,
      start_time:       startTime,
      end_time:         endTime,
      total_price:      totalPrice,
      status:           "confirmed",
    })
    .select()
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  const booking: Booking = {
    id:              row.id,
    cleanerId:       row.cleaner_id,
    customerName:    row.customer_name,
    customerPhone:   row.customer_phone,
    customerAddress: row.customer_address,
    hasPets:         row.has_pets,
    bedrooms:        row.bedrooms,
    bathrooms:       row.bathrooms,
    frequency:       row.frequency,
    date:            row.date,
    timeBlock:       row.time_block,
    startTime:       row.start_time,
    endTime:         row.end_time,
    totalPrice:      Number(row.total_price),
    status:          row.status,
    createdAt:       row.created_at,
  };

  return NextResponse.json(booking, { status: 201 });
}
