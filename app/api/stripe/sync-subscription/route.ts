import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";

type StripeStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete_expired"
  | "incomplete"
  | string;

function mapStatus(stripeStatus: StripeStatus): string {
  switch (stripeStatus) {
    case "active":             return "active";
    case "trialing":           return "trialing";
    case "past_due":           return "past_due";
    case "canceled":           return "canceled";
    case "unpaid":             return "past_due";
    case "incomplete_expired": return "canceled";
    case "incomplete":         return "trialing";
    default:                   return "trialing";
  }
}

export async function POST(req: Request) {
  // 1. Verify auth token
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { cleanerId?: string; email?: string };
  if (!body.cleanerId || body.cleanerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = body.email ?? user.email ?? "";

  // 2. Search Stripe for customer by email
  const customers = await stripe.customers.list({ email, limit: 5 });

  let foundStatus: string | null = null;
  let foundCustomerId: string | null = null;

  // 3. For each customer, look for a subscription (prefer non-canceled)
  for (const cus of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: cus.id, limit: 10 });
    const active = subs.data.find((s) => s.status !== "canceled");
    const sub = active ?? subs.data[0];
    if (sub) {
      foundStatus = mapStatus(sub.status);
      foundCustomerId = cus.id;
      // Stop at first non-canceled subscription
      if (active) break;
    }
  }

  // 4. Update DB
  if (foundStatus === null) {
    // No subscription found
    await supabase
      .from("cleaners")
      .update({ subscription_status: "inactive" })
      .eq("id", body.cleanerId);
    return NextResponse.json({ status: "no_subscription" });
  }

  await supabase
    .from("cleaners")
    .update({
      subscription_status: foundStatus,
      stripe_customer_id: foundCustomerId,
    })
    .eq("id", body.cleanerId);

  return NextResponse.json({ status: foundStatus });
}
