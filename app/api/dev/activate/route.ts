import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { getOwnerEmails } from "@/lib/owners";

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getOwnerEmails().includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase
    .from("cleaners")
    .update({ subscription_status: "active" })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, subscription_status: "active" });
}
