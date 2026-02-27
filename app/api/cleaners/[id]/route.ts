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

const DEFAULT_PRICING: Cleaner["pricingTable"] = {
  "1-1": 80,  "1-2": 95,  "1-3": 110, "1-4": 130, "1-5": 150,
  "2-1": 95,  "2-2": 115, "2-3": 135, "2-4": 155, "2-5": 175,
  "3-1": 115, "3-2": 140, "3-3": 160, "3-4": 185, "3-5": 210,
  "4-1": 135, "4-2": 165, "4-3": 190, "4-4": 220, "4-5": 250,
  "5-1": 160, "5-2": 195, "5-3": 225, "5-4": 260, "5-5": 295,
};

const DEFAULT_DISCOUNTS: Cleaner["frequencyDiscounts"] = {
  weekly: 15, biweekly: 10, monthly: 5,
};

function rowToCleaner(row: Record<string, unknown>): Cleaner {
  return {
    id:                 row.id    as string,
    name:               (row.name  as string) || "New Cleaner",
    email:              (row.email as string) || "",
    phone:              (row.phone              as string) || "",
    messengerUsername:  (row.messenger_username as string) || "",
    availability:       (row.availability        as Cleaner["availability"])        || DEFAULT_AVAILABILITY,
    pricingTable:       (row.pricing_table       as Cleaner["pricingTable"])        || DEFAULT_PRICING,
    frequencyDiscounts: (row.frequency_discounts as Cleaner["frequencyDiscounts"])  || DEFAULT_DISCOUNTS,
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

  // Profile not found — auto-create it.
  // This handles users who signed up before the DB trigger was in place.
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
  if (body.pricingTable        !== undefined) patch.pricing_table        = body.pricingTable;
  if (body.frequencyDiscounts  !== undefined) patch.frequency_discounts  = body.frequencyDiscounts;

  const { data, error } = await supabase
    .from("cleaners")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json(rowToCleaner(data));
}
