import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { rowToCleaner } from "../../_shared";

export const dynamic = "force-dynamic";

// ── GET /api/cleaners/slug/[slug] ─────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("cleaners")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rowToCleaner(data));
}
