import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";

// ── PATCH /api/bookings/[id] — cancel or complete a booking ──────────────────
// Body (optional): { action: "cancel" | "complete" }  — defaults to "cancel"

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

  // Parse optional body
  let action: "cancel" | "complete" = "cancel";
  try {
    const body = await request.json().catch(() => ({})) as { action?: string };
    if (body.action === "complete") action = "complete";
  } catch {
    // no body — keep default
  }

  // Verify the booking belongs to this cleaner
  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("cleaner_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (existing.cleaner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
