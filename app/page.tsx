"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/cleaner/setup");
      } else {
        router.replace("/cleaner/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <span className="text-5xl block">✨</span>
        <p className="text-slate-400 text-sm animate-pulse">Loading CleanClick…</p>
      </div>
    </div>
  );
}
