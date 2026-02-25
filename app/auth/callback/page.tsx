"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createBrowserClient();
    const code = searchParams.get("code");

    if (code) {
      // PKCE flow: exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace("/cleaner/login?error=confirmation_failed");
        } else {
          router.replace("/cleaner/setup");
        }
      });
    } else {
      // Implicit flow: session is in the URL hash — getSession picks it up
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? "/cleaner/setup" : "/cleaner/login");
      });
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <span className="text-5xl block">✨</span>
        <p className="text-slate-400 text-sm animate-pulse">Confirming your account…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse">Loading…</p>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
