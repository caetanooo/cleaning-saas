import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calculateDuration } from "@/lib/timeCalculator";
import type { CleaningServiceType, ProviderTimeConfig } from "@/types";

/**
 * POST /api/bookings/calculate
 *
 * Calculates estimated job duration in minutes given the booking details
 * and the cleaner's time configurations.
 *
 * Body:
 *   cleanerId    string  (uuid)
 *   serviceType  "regular" | "deep" | "move"
 *   bedrooms     number  (1–20)
 *   bathrooms    number  (1–20)
 *   kitchens     number  (optional, default 0)
 *   livingRooms  number  (optional, default 0)
 *   staffCount   number  (1 | 2 | 3, default 1)
 *
 * Response:
 *   { estimatedDuration: number | null, hasConfig: boolean }
 *
 *   estimatedDuration = null means the cleaner has no time configs
 *   and the caller should fall back to legacy morning/afternoon blocks.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    cleanerId,
    serviceType,
    bedrooms,
    bathrooms,
    kitchens    = 0,
    livingRooms = 0,
    staffCount  = 1,
  } = body as Record<string, unknown>;

  if (!cleanerId || typeof cleanerId !== "string") {
    return NextResponse.json({ error: "cleanerId is required" }, { status: 400 });
  }
  if (!serviceType || !["regular", "deep", "move"].includes(serviceType as string)) {
    return NextResponse.json({ error: "serviceType must be regular, deep, or move" }, { status: 400 });
  }
  if (typeof bedrooms !== "number" || bedrooms < 1 || bedrooms > 20) {
    return NextResponse.json({ error: "bedrooms must be between 1 and 20" }, { status: 400 });
  }
  if (typeof bathrooms !== "number" || bathrooms < 1 || bathrooms > 20) {
    return NextResponse.json({ error: "bathrooms must be between 1 and 20" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from("provider_time_configs")
    .select("*")
    .eq("provider_id", cleanerId);

  if (error) {
    console.error("[calculate] fetch time configs error:", error.message);
    return NextResponse.json({ error: "Failed to fetch time configs" }, { status: 500 });
  }

  const timeConfigs: ProviderTimeConfig[] = (rows ?? []).map((r) => ({
    id:           r.id,
    providerId:   r.provider_id,
    serviceType:  r.service_type as CleaningServiceType,
    baseDuration: r.base_duration,
    roomType:     r.room_type,
    timePerRoom:  r.time_per_room,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  }));

  const estimatedDuration = calculateDuration({
    serviceType:  serviceType as CleaningServiceType,
    bedrooms:     bedrooms as number,
    bathrooms:    bathrooms as number,
    kitchens:     kitchens as number,
    livingRooms:  livingRooms as number,
    staffCount:   staffCount as number,
    timeConfigs,
  });

  return NextResponse.json({
    estimatedDuration,
    hasConfig: timeConfigs.filter((c) => c.serviceType === serviceType).length > 0,
  });
}
