import { createClient } from "@supabase/supabase-js";

/**
 * Browser / client-side client.
 * NEXT_PUBLIC_ vars are baked into the bundle at build time by Next.js.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

/**
 * Server-side client (service role, bypasses RLS).
 * Uses SUPABASE_URL (no NEXT_PUBLIC_ prefix) so Next.js does NOT
 * replace it at build time — it is always read from the runtime env.
 * Never import this in client components.
 */
export function createServiceClient() {
  // SUPABASE_URL = same value as NEXT_PUBLIC_SUPABASE_URL but server-only,
  // so it is evaluated at runtime (not baked in the bundle during build).
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}
