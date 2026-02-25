"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CleanClick error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-lg w-full space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="font-extrabold text-slate-800 text-lg">Something went wrong</p>
            {error.digest && (
              <p className="text-xs text-slate-400 mt-0.5">Digest: {error.digest}</p>
            )}
          </div>
        </div>

        <pre className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-red-700 overflow-auto whitespace-pre-wrap break-all">
          {error.message || String(error)}
        </pre>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/cleaner/login"
            className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl text-sm text-center hover:border-slate-300 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
