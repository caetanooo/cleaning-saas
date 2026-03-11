import { createBrowserClient as ssrBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Fallbacks prevent createClient from throwing during SSR when env vars
// are empty strings (Next.js replaces undefined NEXT_PUBLIC_ vars with "").
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-key";

/**
 * Browser / client-side client (anon key, subject to RLS).
 * Uses @supabase/ssr so the session is stored in cookies — readable by
 * the middleware's createServerClient (which also uses cookies).
 * Singleton — only one GoTrueClient instance per browser context.
 */
let _browserClient: ReturnType<typeof ssrBrowserClient> | null = null;

export function createBrowserClient() {
  if (_browserClient) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  _browserClient = ssrBrowserClient(url, key);
  return _browserClient;
}

/**
 * Server-side client (service role, bypasses RLS).
 * SUPABASE_URL has no NEXT_PUBLIC_ prefix so Next.js does NOT replace it
 * at build time — it is always read from the real runtime environment.
 * Never import this in client components.
 */
export function createServiceClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    PLACEHOLDER_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}
