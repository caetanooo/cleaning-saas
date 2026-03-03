import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import type Stripe from "stripe";

function mapStatus(stripeStatus: string): string {
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

async function updateCleanerByCustomerId(customerId: string, status: string) {
  const supabase = createServiceClient();

  // Try direct lookup by stripe_customer_id first
  const { data: rows } = await supabase
    .from("cleaners")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .limit(1);

  if (rows && rows.length > 0) {
    await supabase
      .from("cleaners")
      .update({ subscription_status: status })
      .eq("stripe_customer_id", customerId);
    return;
  }

  // Fall back to email lookup
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;
  const email = (customer as Stripe.Customer).email;
  if (!email) return;

  await supabase
    .from("cleaners")
    .update({ subscription_status: status, stripe_customer_id: customerId })
    .eq("email", email);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await updateCleanerByCustomerId(sub.customer as string, mapStatus(sub.status));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await updateCleanerByCustomerId(sub.customer as string, "canceled");
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (customerId) await updateCleanerByCustomerId(customerId, "active");
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (customerId) await updateCleanerByCustomerId(customerId, "past_due");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
