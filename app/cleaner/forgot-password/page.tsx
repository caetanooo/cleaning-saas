"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createBrowserClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cleaner/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
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
          <p className="text-slate-500 text-sm mt-2">Recover your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-xl font-extrabold text-slate-800 mb-2">Forgot Password</h1>
          <p className="text-slate-500 text-sm mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          {sent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              Check your email for a password reset link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
              >
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>
          )}

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
