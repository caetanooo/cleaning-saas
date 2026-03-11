"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

function CallbackInner() {
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const supabase = createBrowserClient();
    const code = searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>) => {
        if (error || !data.session) {
          setDebugError(error?.message ?? "session null");
          return;
        }
        const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS ?? "").split(",").map(e => e.trim());
        const isOwner = ownerEmails.includes(data.session.user.email ?? "");
        try {
          const syncRes = await fetch("/api/stripe/sync-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ cleanerId: data.session.user.id }),
            signal: AbortSignal.timeout(12000),
          });
          if (!syncRes.ok) throw new Error("sync failed");
          const { status } = await syncRes.json() as { status: string };
          const isBlocked = !isOwner && (status === "past_due" || status === "canceled" || status === "no_subscription");
          window.location.replace(isBlocked ? "/cleaner/subscription" : "/cleaner/setup");
        } catch {
          window.location.replace(isOwner ? "/cleaner/setup" : "/cleaner/subscription");
        }
      });
    } else {
      // Implicit / magic-link flow: session is already in the URL hash.
      supabase.auth.getSession().then(async ({ data: { session } }: Awaited<ReturnType<typeof supabase.auth.getSession>>) => {
        if (!session) { window.location.replace("/cleaner/login"); return; }
        const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS ?? "").split(",").map(e => e.trim());
        const isOwner = ownerEmails.includes(session.user.email ?? "");
        try {
          const syncRes = await fetch("/api/stripe/sync-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ cleanerId: session.user.id }),
            signal: AbortSignal.timeout(12000),
          });
          if (!syncRes.ok) throw new Error("sync failed");
          const { status } = await syncRes.json() as { status: string };
          const isBlocked = !isOwner && (status === "past_due" || status === "canceled" || status === "no_subscription");
          window.location.replace(isBlocked ? "/cleaner/subscription" : "/cleaner/setup");
        } catch {
          window.location.replace(isOwner ? "/cleaner/setup" : "/cleaner/subscription");
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Empty deps: intentionally runs only once on mount.

  if (debugError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full space-y-3">
          <p className="font-bold text-red-700">Auth error (debug)</p>
          <p className="text-sm text-slate-600 font-mono break-all">{debugError}</p>
          <a href="/cleaner/login" className="block text-sm text-sky-500 hover:underline">← Back to login</a>
        </div>
      </div>
    );
  }

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
