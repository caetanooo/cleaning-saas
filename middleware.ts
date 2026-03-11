import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth middleware — redirects unauthenticated users away from protected routes.
 * Subscription checks remain in the page components; this layer only enforces login.
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, redirect to login so pages aren't left unprotected
  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL("/cleaner/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/cleaner/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/cleaner/setup/:path*",
    "/cleaner/agenda/:path*",
  ],
};
