import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { calculateDuration } from "@/lib/timeCalculator";
import type { CleaningServiceType, FrequencyType, ProviderTimeConfig, PricingFormula, FrequencyDiscounts, ServiceAddons } from "@/types";

// ── PATCH /api/bookings/[id] ──────────────────────────────────────────────────
// Body: { action: "cancel" | "complete" | "update_team" | "update_details", ... }
// Defaults to "cancel" when action is omitted.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  // Verify token → get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let action: "cancel" | "complete" | "reopen" | "update_team" | "update_details" = "cancel";
  let bodyData: Record<string, unknown> = {};
  try {
    bodyData = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (bodyData.action === "complete")        action = "complete";
    if (bodyData.action === "reopen")          action = "reopen";
    if (bodyData.action === "update_team")     action = "update_team";
    if (bodyData.action === "update_details")  action = "update_details";
  } catch {
    // no body — keep defaults
  }
  const staffCount = bodyData.staffCount as number | undefined;

  // Verify the booking belongs to this cleaner
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("cleaner_id, status, service_type, frequency, bedrooms, bathrooms, has_pets, has_children, has_carpet, staff_count, estimated_duration, scheduled_start_at")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (existing.cleaner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── update_team ───────────────────────────────────────────────────────────
  if (action === "update_team") {
    if (!staffCount || ![1, 2, 3].includes(staffCount)) {
      return NextResponse.json({ error: "staffCount must be 1, 2, or 3" }, { status: 400 });
    }

    // Fetch time configs to recalculate duration
    const { data: tcRows } = await supabase
      .from("provider_time_configs")
      .select("*")
      .eq("provider_id", user.id);

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

    const newDuration =
      calculateDuration({
        serviceType: (existing.service_type ?? "regular") as CleaningServiceType,
        bedrooms:    (existing.bedrooms  as number) ?? 1,
        bathrooms:   (existing.bathrooms as number) ?? 1,
        staffCount,
        timeConfigs,
      }) ??
      (existing.estimated_duration
        ? Math.ceil((existing.estimated_duration as number) / staffCount)
        : null);

    // Recalculate end timestamp if start is known
    let scheduledEndAt: string | null = null;
    const scheduledStartAt = existing.scheduled_start_at as string | null;
    if (scheduledStartAt && newDuration) {
      const start = new Date(scheduledStartAt);
      scheduledEndAt = new Date(start.getTime() + newDuration * 60_000).toISOString();
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        staff_count:        staffCount,
        estimated_duration: newDuration,
        scheduled_end_at:   scheduledEndAt,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[bookings PATCH update_team] update failed:", updateErr.message);
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, staffCount, estimatedDuration: newDuration });
  }

  // ── update_details ────────────────────────────────────────────────────────
  if (action === "update_details") {
    const newServiceType  = (bodyData.serviceType  as CleaningServiceType) ?? (existing.service_type as CleaningServiceType) ?? "regular";
    const newFrequency    = (bodyData.frequency    as FrequencyType)       ?? (existing.frequency    as FrequencyType)       ?? "one_time";
    const newBedrooms     = (bodyData.bedrooms     as number)              ?? (existing.bedrooms     as number)              ?? 1;
    const newBathrooms    = (bodyData.bathrooms    as number)              ?? (existing.bathrooms    as number)              ?? 1;
    const newHasPets      = (bodyData.hasPets      as boolean)             ?? (existing.has_pets     as boolean)             ?? false;
    const newHasChildren  = (bodyData.hasChildren  as boolean)             ?? (existing.has_children as boolean)             ?? false;
    const newHasCarpet    = (bodyData.hasCarpet    as boolean)             ?? (existing.has_carpet   as boolean)             ?? false;
    const newStaffCount   = (bodyData.staffCount   as number)              ?? (existing.staff_count  as number)              ?? 1;

    // Fetch cleaner pricing + time configs
    const { data: cleanerRow } = await supabase
      .from("cleaners")
      .select("pricing_formula, service_addons, frequency_discounts")
      .eq("id", user.id)
      .single();

    let newTotalPrice: number;
    if (typeof bodyData.totalPrice === "number" && bodyData.totalPrice >= 0) {
      newTotalPrice = Math.round((bodyData.totalPrice as number) * 100) / 100;
    } else {
      const formula: PricingFormula = (cleanerRow?.pricing_formula as PricingFormula) ?? { base: 90, extraPerBedroom: 20, extraPerBathroom: 15 };
      const addons: ServiceAddons   = (cleanerRow?.service_addons  as ServiceAddons)  ?? { deep: 50, move: 80 };
      const discounts               = (cleanerRow?.frequency_discounts as FrequencyDiscounts) ?? { weekly: 0, biweekly: 0, monthly: 0 };
      const base    = formula.base + (newBedrooms - 1) * formula.extraPerBedroom + (newBathrooms - 1) * formula.extraPerBathroom;
      const addon   = newServiceType === "deep" ? (addons.deep ?? 0) : newServiceType === "move" ? (addons.move ?? 0) : 0;
      const discPct = newFrequency === "weekly" ? discounts.weekly : newFrequency === "biweekly" ? discounts.biweekly : newFrequency === "monthly" ? discounts.monthly : 0;
      newTotalPrice = Math.round((base + addon) * (1 - discPct / 100) * 100) / 100;
    }

    const { data: tcRows } = await supabase
      .from("provider_time_configs").select("*").eq("provider_id", user.id);
    const timeConfigs: ProviderTimeConfig[] = (tcRows ?? []).map((r) => ({
      id: r.id, providerId: r.provider_id, serviceType: r.service_type as CleaningServiceType,
      baseDuration: r.base_duration, roomType: r.room_type, timePerRoom: r.time_per_room,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));

    const newDuration = calculateDuration({
      serviceType: newServiceType, bedrooms: newBedrooms, bathrooms: newBathrooms,
      staffCount: newStaffCount, timeConfigs,
    }) ?? (existing.estimated_duration ? Math.ceil((existing.estimated_duration as number) / newStaffCount) : null);

    let scheduledEndAt: string | null = null;
    const scheduledStartAt = existing.scheduled_start_at as string | null;
    if (scheduledStartAt && newDuration) {
      scheduledEndAt = new Date(new Date(scheduledStartAt).getTime() + newDuration * 60_000).toISOString();
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        service_type:       newServiceType,
        frequency:          newFrequency,
        bedrooms:           newBedrooms,
        bathrooms:          newBathrooms,
        has_pets:           newHasPets,
        has_children:       newHasChildren,
        has_carpet:         newHasCarpet,
        staff_count:        newStaffCount,
        total_price:        newTotalPrice,
        estimated_duration: newDuration,
        scheduled_end_at:   scheduledEndAt,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[bookings PATCH update_details] update failed:", updateErr.message);
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true, serviceType: newServiceType, frequency: newFrequency,
      bedrooms: newBedrooms, bathrooms: newBathrooms,
      hasPets: newHasPets, hasChildren: newHasChildren, hasCarpet: newHasCarpet,
      staffCount: newStaffCount, totalPrice: newTotalPrice, estimatedDuration: newDuration,
    });
  }

  // ── cancel / complete / reopen ────────────────────────────────────────────
  if (action === "reopen") {
    if (existing.status !== "completed") {
      return NextResponse.json({ error: "Booking is not completed" }, { status: 400 });
    }
    const { error: reopenErr } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", id);
    if (reopenErr) {
      console.error("[bookings PATCH reopen] update failed:", reopenErr.message);
      return NextResponse.json({ error: "Failed to reopen booking" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }
  if (action === "complete" && existing.status === "completed") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const newStatus = action === "complete" ? "completed" : "cancelled";

  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    console.error("[bookings PATCH] update failed:", error.message);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
