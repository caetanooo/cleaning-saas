import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const OWNER_EMAILS = ["pedro.caetano.3anos@gmail.com", "caetanochavesmaria@gmail.com"];

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!OWNER_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase
    .from("cleaners")
    .update({ subscription_status: "active" })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, subscription_status: "active" });
}
