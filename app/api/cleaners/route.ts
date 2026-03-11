import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { rowToCleaner } from "./_shared";

export async function GET(request: Request) {
  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return only the authenticated cleaner's own record
  const { data, error } = await supabase
    .from("cleaners")
    .select("*")
    .eq("id", user.id)
    .limit(1);
  if (error) {
    console.error("[cleaners GET] fetch failed:", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json(
    (data ?? []).map((row) => rowToCleaner(row as Record<string, unknown>))
  );
}
