/**
 * app/api/webhooks/whatsapp/route.ts
 *
 * WhatsApp Business webhook — verification handshake + incoming message ack.
 *
 * Bookings are confirmed immediately at creation time using the cleaner's
 * configured default staff count. This webhook currently only handles the
 * verification handshake required by Meta.
 *
 * Environment variables needed:
 *   WHATSAPP_VERIFY_TOKEN   — token for webhook verification handshake
 *   WHATSAPP_API_TOKEN      — Bearer token for Graph API sends
 *   WHATSAPP_PHONE_NUMBER_ID — your WhatsApp Business phone number ID
 */

import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";

// ─── GET: Webhook Verification Handshake ─────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && VERIFY_TOKEN) {
    console.log("[whatsapp webhook] verified");
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ─── POST: Incoming Message Handler ──────────────────────────────────────────

export async function POST() {
  // Incoming messages are acknowledged but not processed.
  // Bookings are confirmed at creation using the cleaner's default staff config.
  return NextResponse.json({ ok: true });
}
