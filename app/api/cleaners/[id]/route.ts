import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Cleaner } from "@/types";
import { rowToCleaner } from "../_shared";

// ── GET /api/cleaners/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const result = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", id)
    .single();
  let data = result.data;

  if (!data || result.error) {
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

  return NextResponse.json(rowToCleaner(data));
}

// ── PUT /api/cleaners/[id] ────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Cleaner>;
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
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }
  return NextResponse.json(rowToCleaner(data));
}
