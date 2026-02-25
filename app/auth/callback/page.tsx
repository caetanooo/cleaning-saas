"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

function CallbackInner() {
  const searchParams = useSearchParams();
  // Guard against React StrictMode / dependency-change double-execution.
  // exchangeCodeForSession must only run ONCE — the code is single-use.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const supabase = createBrowserClient();
    const code = searchParams.get("code");

    if (code) {
      // PKCE flow: exchange the one-time code for a session.
      // Use window.location (full reload) so the destination page reads
      // the session from localStorage on a clean initialisation.
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        window.location.replace(
          error ? "/cleaner/login?error=confirmation_failed" : "/cleaner/setup",
        );
      });
    } else {
      // Implicit / magic-link flow: session is already in the URL hash.
      supabase.auth.getSession().then(({ data: { session } }) => {
        window.location.replace(session ? "/cleaner/setup" : "/cleaner/login");
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Empty deps: intentionally runs only once on mount.

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
