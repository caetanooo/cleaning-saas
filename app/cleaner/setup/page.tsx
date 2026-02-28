"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import type { Cleaner, DayOfWeek } from "@/types";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday",    label: "Segunda-feira" },
  { key: "tuesday",   label: "Terça-feira"   },
  { key: "wednesday", label: "Quarta-feira"  },
  { key: "thursday",  label: "Quinta-feira"  },
  { key: "friday",    label: "Sexta-feira"   },
  { key: "saturday",  label: "Sábado"        },
  { key: "sunday",    label: "Domingo"       },
];

function calcBase(formula: Cleaner["pricingFormula"], beds: number, baths: number): number {
  return formula.base + (beds - 1) * formula.extraPerBedroom + (baths - 1) * formula.extraPerBathroom;
}

export default function CleanerSetupPage() {
  const router = useRouter();
  const [cleanerId,       setCleanerId]       = useState<string | null>(null);
  const [token,           setToken]           = useState<string | null>(null);
  const [cleaner,         setCleaner]         = useState<Cleaner | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState("");
  const [copied,          setCopied]          = useState(false);
  const [apiError,        setApiError]        = useState("");
  // Valores brutos (string) para os inputs de preço, permite campo vazio durante edição
  const [draftPrices,     setDraftPrices]     = useState<Record<string, string>>({});
  const [newBlockedDate,  setNewBlockedDate]  = useState("");

  // ── Auth guard → fetch profile ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setApiError("Tempo de carregamento esgotado. Por favor, recarregue a página.");
        setLoading(false);
      }
    }, 10_000);

    async function init() {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session) {
          router.replace("/cleaner/login");
          return;
        }

        setCleanerId(session.user.id);
        setToken(session.access_token);

        const res  = await fetch(`/api/cleaners/${session.user.id}`);
        const data = (await res.json()) as Cleaner & { error?: string };

        if (cancelled) return;

        if (data?.id) {
          setCleaner(data);
        } else {
          setApiError(data?.error ?? "Não foi possível carregar o perfil. Verifique as tabelas no Supabase.");
        }
      } catch (err) {
        if (!cancelled) setApiError(String(err));
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleBlock(day: DayOfWeek, block: "morning" | "afternoon") {
    if (!cleaner) return;
    setCleaner({
      ...cleaner,
      availability: {
        ...cleaner.availability,
        [day]: { ...cleaner.availability[day], [block]: !cleaner.availability[day][block] },
      },
    });
  }

  function updateFormula(field: keyof Cleaner["pricingFormula"], value: string) {
    if (!cleaner) return;
    setDraftPrices((d) => ({ ...d, [`f_${field}`]: value }));
    const num = parseFloat(value);
    setCleaner({
      ...cleaner,
      pricingFormula: { ...cleaner.pricingFormula, [field]: isNaN(num) ? 0 : num },
    });
  }

  function updateAddon(field: "deep" | "move", value: string) {
    if (!cleaner) return;
    setDraftPrices((d) => ({ ...d, [`a_${field}`]: value }));
    const num = parseFloat(value);
    setCleaner({
      ...cleaner,
      serviceAddons: { ...cleaner.serviceAddons, [field]: isNaN(num) ? 0 : num },
    });
  }

  function addBlockedDate() {
    if (!cleaner || !newBlockedDate) return;
    if ((cleaner.blockedDates ?? []).includes(newBlockedDate)) return;
    setCleaner({ ...cleaner, blockedDates: [...(cleaner.blockedDates ?? []), newBlockedDate].sort() });
    setNewBlockedDate("");
  }

  function removeBlockedDate(date: string) {
    if (!cleaner) return;
    setCleaner({ ...cleaner, blockedDates: (cleaner.blockedDates ?? []).filter((d) => d !== date) });
  }

  function formatBlockedDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  function updateDiscount(field: "weekly" | "biweekly" | "monthly", value: string) {
    if (!cleaner) return;
    const num = parseFloat(value);
    setCleaner({
      ...cleaner,
      frequencyDiscounts: {
        ...cleaner.frequencyDiscounts,
        [field]: isNaN(num) ? 0 : num,
      },
    });
  }

  async function handleSave() {
    if (!cleaner || !cleanerId || !token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cleaners/${cleanerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone:              cleaner.phone,
          messengerUsername:  cleaner.messengerUsername,
          availability:       cleaner.availability,
          pricingFormula:     cleaner.pricingFormula,
          frequencyDiscounts: cleaner.frequencyDiscounts,
          serviceAddons:      cleaner.serviceAddons,
          blockedDates:       cleaner.blockedDates ?? [],
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[handleSave] PUT failed:", res.status, errBody);
        throw new Error(errBody?.error ?? "Save failed");
      }
      showToast("Configurações salvas com sucesso!");
    } catch (err) {
      console.error("[handleSave] exception:", err);
      showToast("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await createBrowserClient().auth.signOut();
    router.replace("/cleaner/login");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const bookingLink =
    typeof window !== "undefined" && cleanerId
      ? `${window.location.origin}/book?cleanerId=${cleanerId}`
      : "";

  async function copyLink() {
    if (!bookingLink) return;
    await navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading || !cleanerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Carregando…</p>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-lg w-full space-y-4">
          <p className="font-bold text-slate-800 text-lg">Não foi possível carregar seu perfil</p>
          {apiError && (
            <pre className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-red-700 overflow-auto whitespace-pre-wrap break-all">
              {apiError}
            </pre>
          )}
          <p className="text-sm text-slate-500">
            Certifique-se de que a tabela <strong>cleaners</strong> foi criada no seu projeto Supabase.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  // Linhas da prévia de preços
  const previewRows = [
    { beds: 1, baths: 1 },
    { beds: 2, baths: 1 },
    { beds: 2, baths: 2 },
    { beds: 3, baths: 2 },
    { beds: 4, baths: 3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-800">CleanClick</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{cleaner.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Disponibilidade & Preços</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Olá, {cleaner.name}. Configure sua agenda e valores abaixo.
          </p>
        </div>

        {/* ── Canais de Contato ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sky-100 bg-sky-50">
            <h2 className="font-bold text-slate-800 text-lg">Canais de Contato</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Os clientes usarão estes canais para enviar os detalhes do agendamento. Preencha pelo menos um.
            </p>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Telefone (SMS / WhatsApp)
              </label>
              <input
                type="tel"
                placeholder="+1 (512) 555-0100"
                value={cleaner.phone ?? ""}
                onChange={(e) => setCleaner({ ...cleaner, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Usuário do Facebook Messenger{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Encontrado em facebook.com/seu.usuario. Exemplo: <span className="font-mono">maria.faxina</span>
              </p>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                <span className="px-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-3 select-none">
                  m.me/
                </span>
                <input
                  type="text"
                  placeholder="maria.faxina"
                  value={cleaner.messengerUsername ?? ""}
                  onChange={(e) => setCleaner({ ...cleaner, messengerUsername: e.target.value })}
                  className="flex-1 px-3 py-3 text-sm text-slate-800 bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Rotina Semanal ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Rotina Semanal</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Esta é sua agenda padrão. &nbsp;Manhã a partir das 9h &nbsp;|&nbsp; Tarde a partir das 14h
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {DAYS.map(({ key, label }) => {
              const day = cleaner.availability[key];
              return (
                <div key={key} className="px-6 py-4 flex items-center gap-6">
                  <span className="w-36 text-sm font-semibold text-slate-700">{label}</span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.morning}
                      onChange={() => toggleBlock(key, "morning")}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className={`text-sm ${day.morning ? "text-slate-700" : "text-slate-400"}`}>Manhã</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.afternoon}
                      onChange={() => toggleBlock(key, "afternoon")}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className={`text-sm ${day.afternoon ? "text-slate-700" : "text-slate-400"}`}>Tarde</span>
                  </label>
                  {!day.morning && !day.afternoon && (
                    <span className="text-xs text-slate-400 italic ml-auto">Folga</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Folgas Específicas ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Folgas Específicas</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bloqueie datas pontuais sem alterar sua rotina semanal. Ex: consulta médica, feriado, viagem.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex gap-3">
              <input
                type="date"
                value={newBlockedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
              />
              <button
                type="button"
                disabled={!newBlockedDate}
                onClick={addBlockedDate}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
              >
                Adicionar
              </button>
            </div>
            {(cleaner.blockedDates ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma folga específica adicionada ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {(cleaner.blockedDates ?? []).map((d) => (
                  <li key={d} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-slate-700 font-medium capitalize">{formatBlockedDate(d)}</span>
                    <button
                      type="button"
                      onClick={() => removeBlockedDate(d)}
                      className="text-slate-400 hover:text-red-500 transition-colors text-sm font-semibold ml-4 shrink-0"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Precificação ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Precificação</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Definindo os valores abaixo, calculamos automaticamente o preço para qualquer tamanho de casa.
            </p>
          </div>
          <div className="px-6 py-5 space-y-6">

            {/* Fórmula base */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fórmula Base</p>
                <p className="text-xs text-slate-400 mt-1">
                  Preço = Preço Base + (Quartos − 1) × Quarto Adicional + (Banheiros − 1) × Banheiro Adicional
                </p>
              </div>
              {([
                { field: "base"             as const, label: "Preço Base (1 Bed / 1 Bath)",        prefix: "$",  placeholder: "90"  },
                { field: "extraPerBedroom"  as const, label: "Quarto Adicional",                    prefix: "+$", placeholder: "20"  },
                { field: "extraPerBathroom" as const, label: "Banheiro Adicional",                  prefix: "+$", placeholder: "15"  },
              ]).map(({ field, label, prefix, placeholder }) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-semibold text-slate-700">{label}</label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 w-[120px] shrink-0">
                    <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">{prefix}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={placeholder}
                      value={draftPrices[`f_${field}`] ?? String(cleaner.pricingFormula[field])}
                      onChange={(e) => updateFormula(field, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionais de Serviço */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">Adicionais de Serviço</p>
                <p className="text-xs text-slate-400 mt-1">
                  Valor extra cobrado além do preço base para serviços mais completos.
                </p>
              </div>
              {([
                { field: "deep" as const, label: "Deep Cleaning",      color: "text-sky-600"    },
                { field: "move" as const, label: "Move-in / Move-out", color: "text-violet-600" },
              ]).map(({ field, label, color }) => (
                <div key={field} className="flex items-center gap-4">
                  <label className={`flex-1 text-sm font-semibold ${color}`}>{label}</label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 w-[120px] shrink-0">
                    <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">+$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftPrices[`a_${field}`] ?? String(cleaner.serviceAddons?.[field] ?? 0)}
                      onChange={(e) => updateAddon(field, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Prévia comparativa ao vivo */}
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 mb-3">
                Pré-visualização (Regular Cleaning)
              </p>
              <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                {/* Cabeçalho */}
                <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                  <div className="px-3 py-2 font-bold text-slate-500">Casa</div>
                  <div className="px-3 py-2 font-bold text-slate-600 text-center">Regular</div>
                  <div className="px-3 py-2 font-bold text-sky-600 text-center">Deep</div>
                  <div className="px-3 py-2 font-bold text-violet-600 text-center">Move-in/out</div>
                </div>
                {/* Linhas */}
                {previewRows.map(({ beds, baths }, i) => {
                  const base = calcBase(cleaner.pricingFormula, beds, baths);
                  const deep = base + (cleaner.serviceAddons?.deep ?? 0);
                  const move = base + (cleaner.serviceAddons?.move ?? 0);
                  return (
                    <div
                      key={`${beds}-${baths}`}
                      className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <div className="px-3 py-2.5 text-slate-500">
                        {beds} {beds > 1 ? "qtos" : "qto"} · {baths} {baths > 1 ? "bnhs" : "bnh"}
                      </div>
                      <div className="px-3 py-2.5 font-semibold text-slate-800 text-center">${base.toFixed(0)}</div>
                      <div className="px-3 py-2.5 font-semibold text-sky-600 text-center">${deep.toFixed(0)}</div>
                      <div className="px-3 py-2.5 font-semibold text-violet-600 text-center">${move.toFixed(0)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Descontos por Frequência ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Descontos por Frequência</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Desconto em % oferecido para clientes com agendamentos recorrentes.
            </p>
          </div>
          <div className="px-6 py-5 grid grid-cols-3 gap-6">
            {(
              [
                { field: "weekly",   label: "Semanal"   },
                { field: "biweekly", label: "Quinzenal" },
                { field: "monthly",  label: "Mensal"    },
              ] as const
            ).map(({ field, label }) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={cleaner.frequencyDiscounts[field]}
                    onChange={(e) => updateDiscount(field, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                  />
                  <span className="px-3 text-slate-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Link de Agendamento ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Seu Link de Agendamento</h2>
            <p className="text-xs text-slate-400 mt-0.5">Compartilhe este link com seus clientes.</p>
          </div>
          <div className="px-6 py-5 flex items-center gap-3">
            <input
              readOnly
              value={bookingLink}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 bg-slate-50 focus:outline-none"
            />
            <button
              type="button"
              onClick={copyLink}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                copied ? "bg-green-500 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"
              }`}
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </section>

        {/* Salvar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
        >
          {saving ? "Salvando…" : "Salvar Configurações"}
        </button>
      </main>
    </div>
  );
}
