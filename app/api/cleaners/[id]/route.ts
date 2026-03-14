import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { rowToCleaner, rowToPublicCleaner } from "../_shared";
import { isVipEmail } from "@/lib/vip";

// ── GET /api/cleaners/[id] ────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Check if the caller is the authenticated owner
  const token = extractBearerToken(req.headers.get("Authorization"));
  let isOwner = false;
  let callerEmail = "";
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    isOwner = !!user && user.id === id;
    callerEmail = user?.email ?? "";
  }

  const result = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", id)
    .single();
  let data = result.data;

  // Auto-create profile only for authenticated owner
  if ((!data || result.error) && isOwner) {
    const { data: authUser } = await supabase.auth.admin.getUserById(id);
    const name  = authUser?.user?.user_metadata?.name  || "New Cleaner";
    const email = authUser?.user?.email || "";

    const { data: created, error: createError } = await supabase
      .from("cleaners")
      .insert({ id, name, email })
      .select()
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: "Profile not found. Make sure the database tables have been created in Supabase." },
        { status: 404 },
      );
    }
    data = created;
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return full profile to owner (with isVip flag), public-safe profile to everyone else
  if (isOwner) {
    const cleaner = rowToCleaner(data);
    cleaner.isVip = isVipEmail(callerEmail);
    return NextResponse.json(cleaner);
  }
  return NextResponse.json(rowToPublicCleaner(data));
}

// ── PUT /api/cleaners/[id] ────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;

  // Guard against excessively large payloads
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 50_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const patch: Record<string, unknown> = {};
  if (body.phone               !== undefined) patch.phone                = body.phone;
  if (body.messengerUsername   !== undefined) patch.messenger_username   = body.messengerUsername;
  if (body.availability        !== undefined) patch.availability         = body.availability;
  if (body.pricingFormula      !== undefined) patch.pricing_formula      = body.pricingFormula;
  if (body.frequencyDiscounts  !== undefined) patch.frequency_discounts  = body.frequencyDiscounts;
  if (body.serviceAddons       !== undefined) patch.service_addons       = body.serviceAddons;
  if (body.blockedDates        !== undefined) patch.blocked_dates        = body.blockedDates;
  if (body.slug                !== undefined) patch.slug                 = body.slug ?? null;

  const { data, error } = await supabase
    .from("cleaners")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) {
    console.error("[cleaners PUT] update failed:", error?.message, "patch keys:", Object.keys(patch));
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(rowToCleaner(data));
}
