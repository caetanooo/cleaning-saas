"use client";

import { useState } from "react";

type Tab = "painel" | "cliente" | "precos";

// ─── Tab: Seu Painel ──────────────────────────────────────────────────────────

function PainelTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">Agenda de Hoje</h3>
          <p className="text-xs text-slate-400">Terça-feira, 4 de março</p>
        </div>
        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full">
          2 faxinas
        </span>
      </div>

      {/* Booking 1 */}
      <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-slate-50 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Sarah Johnson</p>
              <p className="text-xs text-slate-500">Regular Cleaning · Weekly</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shrink-0">
            10:00 AM
          </span>
        </div>
        <p className="text-xs text-slate-400 pl-5 mb-3">📍 123 Oak Street, Austin TX</p>
        <div className="flex items-center gap-3 pl-5 flex-wrap">
          <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">
            3 bed · 2 bath
          </span>
          <span className="text-sm font-extrabold text-sky-600">$120</span>
        </div>
      </div>

      {/* Booking 2 */}
      <div className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-slate-50 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 text-sm">John Williams</p>
              <p className="text-xs text-slate-500">Deep Cleaning · One-time</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shrink-0">
            2:00 PM
          </span>
        </div>
        <p className="text-xs text-slate-400 pl-5 mb-3">📍 456 Maple Ave, Austin TX</p>
        <div className="flex items-center gap-3 pl-5 flex-wrap">
          <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">
            4 bed · 3 bath
          </span>
          <span className="text-sm font-extrabold text-sky-600">$220</span>
        </div>
      </div>

      {/* Daily total */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-sky-800">Total do dia</p>
        <p className="text-xl font-extrabold text-sky-600">$340 ✨</p>
      </div>
    </div>
  );
}

// ─── Tab: O que o Cliente vê ──────────────────────────────────────────────────

function ClienteTab() {
  return (
    <div className="max-w-sm mx-auto space-y-5">
      {/* Header */}
      <div className="text-center">
        <p className="font-extrabold text-slate-800 text-base">Ana&apos;s Cleaning ✨</p>
        <p className="text-xs text-sky-500 font-semibold mt-0.5">Book your cleaning</p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? "bg-sky-500" : "bg-slate-200"}`} />
        ))}
      </div>

      {/* Bedrooms */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bedrooms</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center ${
                n === 2
                  ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bathrooms</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center ${
                n === 2
                  ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Frequency</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "One-time",  discount: "" },
            { label: "Monthly",   discount: "5% off" },
            { label: "Bi-weekly", discount: "10% off", active: true },
            { label: "Weekly",    discount: "15% off" },
          ].map(({ label, discount, active }) => (
            <div
              key={label}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold ${
                active
                  ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className="block font-bold">{label}</span>
              {discount && (
                <span className={`text-xs ${active ? "text-sky-100" : "text-teal-500"}`}>
                  {discount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Price per session</p>
          <p className="text-2xl font-extrabold text-sky-600">$108</p>
        </div>
        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1.5 rounded-full text-right">
          10% bi-weekly<br />discount ✓
        </span>
      </div>
    </div>
  );
}

// ─── Tab: Configuração de Preços ──────────────────────────────────────────────

function PrecosTab() {
  return (
    <div className="max-w-sm mx-auto space-y-5">
      {/* Base price */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Preço Base</p>
        <div className="flex items-center border-2 border-sky-400 rounded-xl overflow-hidden bg-white">
          <span className="bg-sky-50 text-sky-600 font-extrabold px-4 py-3 text-base border-r border-sky-200">
            $
          </span>
          <span className="px-4 py-3 font-extrabold text-slate-800 text-xl flex-1">150</span>
          <span className="text-xs text-slate-400 pr-4">por sessão</span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Para 1 quarto / 1 banheiro</p>
      </div>

      {/* Extras per room */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Quarto extra</p>
          <p className="text-xl font-extrabold text-slate-800">+$20</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Banheiro extra</p>
          <p className="text-xl font-extrabold text-slate-800">+$15</p>
        </div>
      </div>

      {/* Service addons */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Adicionais por serviço</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span>🧹</span>
              <span className="text-sm font-semibold text-slate-700">Deep Cleaning</span>
            </div>
            <span className="text-sm font-extrabold text-violet-600">+$50</span>
          </div>
          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span className="text-sm font-semibold text-slate-700">Move-in / Move-out</span>
            </div>
            <span className="text-sm font-extrabold text-amber-600">+$80</span>
          </div>
        </div>
      </div>

      {/* Live example calculation */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-sky-700 uppercase mb-3">✨ Exemplo ao vivo</p>
        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
          {[
            ["Base (1 bed / 1 bath)",    "$150"],
            ["+ 2 quartos extras",        "+$40"],
            ["+ 1 banheiro extra",        "+$15"],
            ["Deep Cleaning",             "+$50"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-semibold">{val}</span>
            </div>
          ))}
          <div className="flex justify-between text-teal-600">
            <span>Desconto quinzenal (10%)</span>
            <span className="font-semibold">−$25.50</span>
          </div>
          <div className="border-t border-sky-200 pt-2 flex justify-between">
            <span className="font-bold text-sky-800">Casa 3/2 · Deep · Bi-weekly</span>
            <span className="font-extrabold text-sky-700 text-sm">$229.50</span>
          </div>
        </div>
        <p className="text-[10px] text-sky-600 font-medium">
          ✓ O sistema calcula isso automaticamente para cada cliente
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "painel",  emoji: "📅", label: "Seu Painel" },
  { id: "cliente", emoji: "👤", label: "O que o Cliente vê" },
  { id: "precos",  emoji: "💰", label: "Configuração de Preços" },
];

export default function DemoTabs() {
  const [active, setActive] = useState<Tab>("painel");

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Veja o sistema em ação
          </h2>
          <p className="text-slate-500 text-lg">
            Isso é o que você e seus clientes vão ver — de verdade.
          </p>
        </div>

        {/* Tab buttons — grid so each takes equal 1/3 width on all screen sizes */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                active === tab.id
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              <span className="text-lg leading-none">{tab.emoji}</span>
              <span className="leading-tight text-center">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 min-h-[320px]">
          {active === "painel"  && <PainelTab />}
          {active === "cliente" && <ClienteTab />}
          {active === "precos"  && <PrecosTab />}
        </div>

      </div>
    </section>
  );
}
