"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

const CHECKOUT_URL = "https://buy.stripe.com/eVqeV6cfsbOmgz72zR57W00";

export default function SubscriptionPage() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  async function handleRetry() {
    setError("");
    setRetrying(true);
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/cleaner/login");
        return;
      }

      const res = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cleanerId: session.user.id, email: session.user.email }),
      });

      const { status } = await res.json() as { status: string };
      const isBlocked =
        status === "past_due" || status === "canceled" || status === "no_subscription";

      if (isBlocked) {
        setError("Assinatura ainda não encontrada ou inativa. Aguarde alguns instantes e tente novamente.");
      } else {
        router.replace("/cleaner/setup");
      }
    } catch {
      setError("Erro ao verificar assinatura. Tente novamente.");
    } finally {
      setRetrying(false);
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>

          <h1 className="text-xl font-extrabold text-slate-800">Acesso suspenso</h1>

          <p className="text-slate-500 text-sm leading-relaxed">
            Sua assinatura está com pendência de pagamento ou foi cancelada.
            Para continuar usando o CleanClick, atualize seu método de pagamento
            ou reative sua assinatura pelo link abaixo.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            Reativar assinatura →
          </a>

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full text-sky-500 hover:text-sky-600 font-semibold text-sm disabled:opacity-60 transition-colors"
          >
            {retrying ? "Verificando…" : "Já reativei — Tentar novamente"}
          </button>
        </div>
      </div>
    </div>
  );
}
