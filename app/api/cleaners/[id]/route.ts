import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Cleaner } from "@/types";

// ── Defaults used when JSONB columns are NULL in the DB ───────────────────────

const DEFAULT_AVAILABILITY: Cleaner["availability"] = {
  monday:    { morning: true,  afternoon: true  },
  tuesday:   { morning: true,  afternoon: true  },
  wednesday: { morning: true,  afternoon: true  },
  thursday:  { morning: true,  afternoon: true  },
  friday:    { morning: true,  afternoon: true  },
  saturday:  { morning: true,  afternoon: false },
  sunday:    { morning: false, afternoon: false },
};

const DEFAULT_FORMULA: Cleaner["pricingFormula"] = {
  base: 90,
  extraPerBedroom: 20,
  extraPerBathroom: 15,
};

const DEFAULT_DISCOUNTS: Cleaner["frequencyDiscounts"] = {
  weekly: 15, biweekly: 10, monthly: 5,
};

const DEFAULT_ADDONS: Cleaner["serviceAddons"] = {
  deep: 50,
  move: 80,
};

function rowToCleaner(row: Record<string, unknown>): Cleaner {
  return {
    id:                 row.id    as string,
    name:               (row.name  as string) || "New Cleaner",
    email:              (row.email as string) || "",
    phone:              (row.phone              as string) || "",
    messengerUsername:  (row.messenger_username as string) || "",
    availability:       (row.availability        as Cleaner["availability"])        || DEFAULT_AVAILABILITY,
    pricingFormula:     (row.pricing_formula     as Cleaner["pricingFormula"])      || DEFAULT_FORMULA,
    frequencyDiscounts: (row.frequency_discounts as Cleaner["frequencyDiscounts"])  || DEFAULT_DISCOUNTS,
    serviceAddons:      (row.service_addons      as Cleaner["serviceAddons"])       || DEFAULT_ADDONS,
  };
}

// ── GET /api/cleaners/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  let { data, error } = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", id)
    .single();

  if (!data || error) {
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

  const { data, error } = await supabase
    .from("cleaners")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json(rowToCleaner(data));
}
