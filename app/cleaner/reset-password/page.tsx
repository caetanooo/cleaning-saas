"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  const ran = useRef(false);

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>) => {
        if (err) {
          setError("Link inválido ou expirado.");
        } else {
          setReady(true);
        }
      });
    } else {
      // Implicit flow — Supabase SDK processes the hash automatically.
      supabase.auth.getSession().then(({ data: { session } }: Awaited<ReturnType<typeof supabase.auth.getSession>>) => {
        if (!session) {
          setError("Link inválido ou expirado.");
        } else {
          setReady(true);
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/cleaner/setup"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">✨</span>
            <span className="text-2xl font-extrabold text-slate-800">CleanClick</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Create a new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-xl font-extrabold text-slate-800 mb-6">Reset Password</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
              <div className="mt-2">
                <Link href="/cleaner/forgot-password" className="text-sky-500 font-semibold hover:underline">
                  Request a new link
                </Link>
              </div>
            </div>
          )}

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              Password updated! Redirecting to dashboard…
            </div>
          ) : ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
              >
                {loading ? "Saving…" : "Set New Password →"}
              </button>
            </form>
          ) : !error ? (
            <p className="text-slate-400 text-sm text-center animate-pulse">Verifying your link…</p>
          ) : null}

          <p className="text-center text-sm text-slate-500 mt-5">
            <Link href="/cleaner/login" className="text-sky-500 font-semibold hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse">Loading…</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
