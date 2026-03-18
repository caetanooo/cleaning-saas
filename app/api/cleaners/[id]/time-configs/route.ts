import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import type { CleaningServiceType, RoomType, ProviderTimeConfig } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/cleaners/[id]/time-configs
 *
 * Returns all provider_time_configs rows for this cleaner.
 * Requires Bearer token; only the owner can read their own configs.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const token = extractBearerToken(request.headers.get("Authorization") ?? "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Verify token → get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("provider_time_configs")
    .select("*")
    .eq("provider_id", id)
    .order("service_type")
    .order("room_type");

  if (error) {
    console.error("[time-configs GET] error:", error.message);
    return NextResponse.json({ error: "Failed to fetch time configs" }, { status: 500 });
  }

  const configs: ProviderTimeConfig[] = (rows ?? []).map((r) => ({
    id:           r.id,
    providerId:   r.provider_id,
    serviceType:  r.service_type as CleaningServiceType,
    baseDuration: r.base_duration,
    roomType:     r.room_type as RoomType,
    timePerRoom:  r.time_per_room,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  }));

  return NextResponse.json({ configs });
}

/**
 * PUT /api/cleaners/[id]/time-configs
 *
 * Upserts the full set of time configs for this cleaner.
 * Replaces existing rows with the provided set (delete + insert strategy).
 *
 * Body:
 *   {
 *     configs: Array<{
 *       serviceType: "regular" | "deep" | "move",
 *       baseDuration: number,
 *       roomType: "bedroom" | "bathroom" | "kitchen" | "living_room",
 *       timePerRoom: number
 *     }>
 *   }
 */
export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const token = extractBearerToken(request.headers.get("Authorization") ?? "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { configs } = body as { configs?: unknown[] };
  if (!Array.isArray(configs)) {
    return NextResponse.json({ error: "configs must be an array" }, { status: 400 });
  }

  const VALID_SERVICE_TYPES = ["regular", "deep", "move"];
  const VALID_ROOM_TYPES    = ["bedroom", "bathroom", "kitchen", "living_room"];

  for (const cfg of configs) {
    const c = cfg as Record<string, unknown>;
    if (!VALID_SERVICE_TYPES.includes(c.serviceType as string)) {
      return NextResponse.json({ error: `Invalid serviceType: ${c.serviceType}` }, { status: 400 });
    }
    if (!VALID_ROOM_TYPES.includes(c.roomType as string)) {
      return NextResponse.json({ error: `Invalid roomType: ${c.roomType}` }, { status: 400 });
    }
    if (typeof c.baseDuration !== "number" || c.baseDuration < 1) {
      return NextResponse.json({ error: "baseDuration must be a positive integer" }, { status: 400 });
    }
    if (typeof c.timePerRoom !== "number" || c.timePerRoom < 0) {
      return NextResponse.json({ error: "timePerRoom must be a non-negative integer" }, { status: 400 });
    }
  }

  // Delete all existing configs for this provider and re-insert
  const { error: deleteError } = await supabase
    .from("provider_time_configs")
    .delete()
    .eq("provider_id", id);

  if (deleteError) {
    console.error("[time-configs PUT] delete error:", deleteError.message);
    return NextResponse.json({ error: "Failed to update time configs" }, { status: 500 });
  }

  if (configs.length === 0) {
    return NextResponse.json({ ok: true, configs: [] });
  }

  const rows = configs.map((cfg) => {
    const c = cfg as Record<string, unknown>;
    return {
      provider_id:   id,
      service_type:  c.serviceType as string,
      base_duration: c.baseDuration as number,
      room_type:     c.roomType as string,
      time_per_room: c.timePerRoom as number,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("provider_time_configs")
    .insert(rows)
    .select();

  if (insertError) {
    console.error("[time-configs PUT] insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to save time configs" }, { status: 500 });
  }

  const saved: ProviderTimeConfig[] = (inserted ?? []).map((r) => ({
    id:           r.id,
    providerId:   r.provider_id,
    serviceType:  r.service_type as CleaningServiceType,
    baseDuration: r.base_duration,
    roomType:     r.room_type as RoomType,
    timePerRoom:  r.time_per_room,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  }));

  return NextResponse.json({ ok: true, configs: saved });
}
