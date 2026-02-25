import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/** Client-side Supabase client (anon key, subject to RLS) */
export function createBrowserClient() {
  return createClient(url, anon);
}

/**
 * Server-side Supabase client (service role, bypasses RLS).
 * Never import this in client components.
 */
export function createServiceClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";
  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  });
}
