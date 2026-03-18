import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { sendWhatsAppMessage, buildCleanerNotificationMessage } from "@/lib/whatsapp";
import { calculateDuration, hasOverlap, bookingRowsToBlocks, timeToMinutes } from "@/lib/timeCalculator";
import type { Booking, BookingStatus, FrequencyType, TimeBlock, CleaningServiceType, PricingFormula, FrequencyDiscounts, ServiceAddons, ProviderTimeConfig } from "@/types";

function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id:              row.id              as string,
    cleanerId:       row.cleaner_id     as string,
    customerName:    row.customer_name  as string,
    customerPhone:   row.customer_phone as string,
    customerAddress: row.customer_address as string,
    hasPets:         row.has_pets        as boolean,
    hasChildren:     (row.has_children  as boolean) ?? false,
    hasCarpet:       (row.has_carpet    as boolean) ?? false,
    bedrooms:        row.bedrooms       as number,
    bathrooms:       row.bathrooms      as number,
    serviceType:     (row.service_type  as CleaningServiceType) || undefined,
    frequency:       row.frequency      as FrequencyType,
    date:            row.date           as string,
    timeBlock:       row.time_block     as TimeBlock,
    startTime:        row.start_time          as string,
    endTime:          row.end_time            as string,
    totalPrice:       Number(row.total_price),
    status:           row.status              as BookingStatus,
    source:           (row.source as "platform" | "manual") ?? "platform",
    createdAt:        row.created_at          as string,
    estimatedDuration: row.estimated_duration as number | undefined,
    staffCount:        row.staff_count        as number | undefined,
    scheduledStartAt:  row.scheduled_start_at as string | undefined,
    scheduledEndAt:    row.scheduled_end_at   as string | undefined,
  };
}

const BLOCK_TIMES: Record<TimeBlock, { startTime: string; endTime: string }> = {
  morning:   { startTime: "09:00", endTime: "13:00" },
  afternoon: { startTime: "13:30", endTime: "18:00" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cleanerId = searchParams.get("cleanerId");
  if (!cleanerId) return NextResponse.json({ error: "cleanerId required" }, { status: 400 });

  // Require auth — only the cleaner themselves can list their bookings
  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.id !== cleanerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("cleaner_id", cleanerId)
    .order("date", { ascending: true });
  if (error) {
    console.error("[bookings GET] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(rowToBooking));
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (err) {
    console.error("[bookings POST] unhandled error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  // Guard against excessively large payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const body = (await request.json()) as {
    cleanerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    hasPets:     boolean;
    hasChildren: boolean;
    hasCarpet:   boolean;
    bedrooms: number;
    bathrooms: number;
    serviceType?: CleaningServiceType;
    frequency: FrequencyType;
    date: string;
    timeBlock: TimeBlock;
    source?: "platform" | "manual";
    totalPrice?: number;       // only accepted for manual bookings
    // Dynamic scheduling fields (optional)
    scheduledStartTime?: string;   // "HH:MM" — exact start time from slot picker
    estimatedDuration?: number;    // pre-calculated minutes from /api/bookings/calculate
  };

  // Input validation
  const validFrequencies = ["one_time", "weekly", "biweekly", "monthly"];
  const validTimeBlocks  = ["morning", "afternoon"];
  const validServices    = ["regular", "deep", "move"];

  if (
    !body.cleanerId || typeof body.cleanerId !== "string" ||
    !body.customerName?.trim() ||
    !body.customerPhone?.trim() ||
    !body.customerAddress?.trim() ||
    typeof body.bedrooms  !== "number" || !Number.isInteger(body.bedrooms)  || body.bedrooms  < 1 || body.bedrooms  > 20 ||
    typeof body.bathrooms !== "number" || !Number.isInteger(body.bathrooms) || body.bathrooms < 1 || body.bathrooms > 20 ||
    !validFrequencies.includes(body.frequency) ||
    !validTimeBlocks.includes(body.timeBlock) ||
    (body.serviceType && !validServices.includes(body.serviceType)) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
  ) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const isManual = body.source === "manual";
  const supabase = createServiceClient();

  // Manual bookings require the cleaner to be authenticated
  if (isManual) {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== body.cleanerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Fetch cleaner pricing + phone (core columns — always present)
  const { data: cleanerRow, error: cleanerError } = await supabase
    .from("cleaners")
    .select("pricing_formula, service_addons, frequency_discounts, phone")
    .eq("id", body.cleanerId)
    .single();
  if (cleanerError || !cleanerRow) {
    return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
  }

  // Fetch default_staff_count (column exists after running SETUP.sql)
  const { data: staffRow } = await supabase
    .from("cleaners")
    .select("default_staff_count")
    .eq("id", body.cleanerId)
    .single();

  const formula: PricingFormula = (cleanerRow.pricing_formula as PricingFormula) ?? {
    base: 90, extraPerBedroom: 20, extraPerBathroom: 15,
  };
  const addons: ServiceAddons = (cleanerRow.service_addons as ServiceAddons) ?? {
    deep: 50, move: 80,
  };
  const frequencyDiscounts: FrequencyDiscounts = (cleanerRow.frequency_discounts as FrequencyDiscounts) ?? {
    weekly: 0, biweekly: 0, monthly: 0,
  };

  let totalPrice: number;
  if (isManual && typeof body.totalPrice === "number" && body.totalPrice >= 0) {
    totalPrice = Math.round(body.totalPrice * 100) / 100;
  } else {
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
    totalPrice = Math.round(subtotal * (1 - discountPct / 100) * 100) / 100;
  }

  // Legacy race-condition guard: only applies when no exact start time is given.
  // Dynamic bookings (with scheduledStartTime) are protected by the hasOverlap check below.
  if (!body.scheduledStartTime) {
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
  }

  // For platform bookings without an explicit scheduledStartTime, calculate duration
  // using the cleaner's default staff count and time configs.
  let resolvedStaffCount = 1;
  let resolvedDuration: number | null = body.estimatedDuration ?? null;
  if (!isManual && !body.scheduledStartTime) {
    const defaultStaff = (staffRow?.default_staff_count ?? null) as { regular: number; deep: number; move: number } | null;
    const svcKey = (body.serviceType ?? "regular") as CleaningServiceType;
    resolvedStaffCount = defaultStaff?.[svcKey] ?? 1;

    // Fetch time configs to calculate duration
    const { data: tcRows } = await supabase
      .from("provider_time_configs")
      .select("*")
      .eq("provider_id", body.cleanerId);

    const timeConfigs: ProviderTimeConfig[] = (tcRows ?? []).map((r) => ({
      id:           r.id,
      providerId:   r.provider_id,
      serviceType:  r.service_type as CleaningServiceType,
      baseDuration: r.base_duration,
      roomType:     r.room_type,
      timePerRoom:  r.time_per_room,
      createdAt:    r.created_at,
      updatedAt:    r.updated_at,
    }));

    if (timeConfigs.length > 0) {
      resolvedDuration = calculateDuration({
        serviceType:  svcKey,
        bedrooms:     body.bedrooms,
        bathrooms:    body.bathrooms,
        staffCount:   resolvedStaffCount,
        timeConfigs,
      });
    }
  } else if (body.scheduledStartTime && body.estimatedDuration) {
    // Caller already provided exact time + duration (wizard with slot picker)
    resolvedStaffCount = 1; // staffCount from slot picker not currently sent
    resolvedDuration   = body.estimatedDuration;
  }

  // Dynamic overlap guard: for exact-time bookings, check timestamp overlap
  if (body.scheduledStartTime && resolvedDuration) {
    const { data: dayBookings } = await supabase
      .from("bookings")
      .select("time_block, scheduled_start_at, scheduled_end_at, estimated_duration")
      .eq("cleaner_id", body.cleanerId)
      .eq("date", body.date)
      .neq("status", "cancelled");

    const blocks = bookingRowsToBlocks(dayBookings ?? []);
    const startMin = timeToMinutes(body.scheduledStartTime);
    if (hasOverlap(startMin, resolvedDuration!, blocks)) {
      return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
    }
  }

  const { startTime, endTime } = BLOCK_TIMES[body.timeBlock];

  // Build dynamic scheduling timestamps if a precise start time was provided
  let scheduledStartAt: string | null = null;
  let scheduledEndAt:   string | null = null;
  if (body.scheduledStartTime && resolvedDuration) {
    const [h, m] = body.scheduledStartTime.split(":").map(Number);
    const startDate = new Date(`${body.date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
    const endDate   = new Date(startDate.getTime() + resolvedDuration * 60_000);
    scheduledStartAt = startDate.toISOString();
    scheduledEndAt   = endDate.toISOString();
  }

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      cleaner_id:          body.cleanerId,
      customer_name:       body.customerName,
      customer_phone:      body.customerPhone,
      customer_address:    body.customerAddress,
      has_pets:            body.hasPets,
      has_children:        body.hasChildren ?? false,
      has_carpet:          body.hasCarpet   ?? false,
      bedrooms:            body.bedrooms,
      bathrooms:           body.bathrooms,
      service_type:        body.serviceType ?? "regular",
      frequency:           body.frequency,
      date:                body.date,
      time_block:          body.timeBlock,
      start_time:          startTime,
      end_time:            endTime,
      total_price:         totalPrice,
      // All bookings confirm immediately — platform bookings use the cleaner's
      // default staff count to calculate duration up-front.
      status:              "confirmed",
      whatsapp_state:      null,
      source:              isManual ? "manual" : "platform",
      estimated_duration:  resolvedDuration ?? null,
      staff_count:         resolvedStaffCount,
      scheduled_start_at:  scheduledStartAt,
      scheduled_end_at:    scheduledEndAt,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — slot taken by concurrent request
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
    }
    console.error("[bookings POST] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Send WhatsApp notification to the cleaner for platform bookings
  if (!isManual) {
    const cleanerPhone = cleanerRow.phone as string | null;
    if (cleanerPhone) {
      const message = buildCleanerNotificationMessage({
        date:              body.date,
        startTime:         body.scheduledStartTime ?? null,
        bedrooms:          body.bedrooms,
        bathrooms:         body.bathrooms,
        serviceType:       body.serviceType ?? "regular",
        estimatedDuration: resolvedDuration ?? null,
        staffCount:        resolvedStaffCount,
        totalPrice,
        customerAddress:   body.customerAddress,
      });
      // Fire-and-forget — do not block the response on WhatsApp delivery
      sendWhatsAppMessage(cleanerPhone, message).catch((err) =>
        console.error("[bookings POST] whatsapp notification failed:", err),
      );
    }
  }

  // Return only the server-generated fields — customer PII stays client-side
  const booking = rowToBooking(row as Record<string, unknown>);
  return NextResponse.json(
    {
      id:         booking.id,
      date:       booking.date,
      timeBlock:  booking.timeBlock,
      startTime:  booking.startTime,
      endTime:    booking.endTime,
      totalPrice: booking.totalPrice,
      status:     booking.status,
    },
    { status: 201 },
  );
}
