import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractBearerToken } from "@/lib/auth";
import { isVipEmail } from "@/lib/vip";

// GET /api/vip/check
// Returns { isVip: boolean } for the authenticated user.
export async function GET(req: Request) {
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ isVip: false });
  }

  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user?.email) {
    return NextResponse.json({ isVip: false });
  }

  return NextResponse.json({ isVip: isVipEmail(user.email) });
}
