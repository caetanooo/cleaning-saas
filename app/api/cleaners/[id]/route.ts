import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Cleaner } from "@/types";

function rowToCleaner(row: Record<string, unknown>): Cleaner {
  return {
    id:                 row.id                  as string,
    name:               row.name                as string,
    email:              row.email               as string,
    availability:       row.availability        as Cleaner["availability"],
    pricingTable:       row.pricing_table       as Cleaner["pricingTable"],
    frequencyDiscounts: row.frequency_discounts as Cleaner["frequencyDiscounts"],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rowToCleaner(data));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Verify the caller is the cleaner who owns this profile
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<Cleaner>;
  const patch: Record<string, unknown> = {};
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
