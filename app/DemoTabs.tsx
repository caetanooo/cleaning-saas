"use client";

import { useState } from "react";

type Tab = "agenda" | "link" | "precos";

// ─── Agenda Tab data ──────────────────────────────────────────────────────────
// March 2026: starts on Sunday (offset = 0), 31 days, today = 3

const MARCH_START = 0; // Sunday
const MARCH_DAYS  = 31;
const TODAY_DAY   = 3;

const BOOKINGS_MAP: Record<number, { morning?: string; afternoon?: string }> = {
  3:  { morning: "Maria Silva" },
  4:  { morning: "Sarah Johnson", afternoon: "John Williams" },
  5:  { morning: "Emily Clark" },
  7:  { afternoon: "David Lee" },
  10: { morning: "Lisa Park" },
  12: { morning: "Tom Baker",   afternoon: "Anna Reeves" },
  17: { morning: "James Carter" },
  19: { afternoon: "Mia Turner" },
  24: { morning: "Chris Evans", afternoon: "Kate Wills" },
};

const BLOCKED_DAYS = new Set([8, 15, 22]);

const UPCOMING = [
  { dot: "bg-sky-500",    date: "Ter, 3 de Março", period: "Manhã (9h–13h)",    name: "Maria Silva",   address: "123 Oak St, Austin, TX" },
  { dot: "bg-sky-500",    date: "Qua, 4 de Março", period: "Manhã (9h–13h)",    name: "Sarah Johnson", address: "456 Pine Ave, Austin, TX" },
  { dot: "bg-violet-500", date: "Qua, 4 de Março", period: "Tarde (13h30–18h)", name: "John Williams", address: "789 Elm Blvd, Austin, TX" },
  { dot: "bg-sky-500",    date: "Qui, 5 de Março", period: "Manhã (9h–13h)",    name: "Emily Clark",   address: "321 Maple Dr, Austin, TX" },
];

// ─── Booking Tab data ─────────────────────────────────────────────────────────

const STEPS = ["House Size", "Frequency", "Date & Time", "Your Details"];

// ─── Tab: Sua Agenda ──────────────────────────────────────────────────────────

function AgendaTab() {
  const cells: (number | null)[] = [];
  for (let i = 0; i < MARCH_START; i++) cells.push(null);
  for (let d = 1; d <= MARCH_DAYS; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const totalBookings = Object.values(BOOKINGS_MAP).reduce(
    (acc, b) => acc + (b.morning ? 1 : 0) + (b.afternoon ? 1 : 0),
    0,
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Minha Agenda</h3>
          <p className="text-xs text-slate-400 mt-0.5">Março 2026</p>
        </div>
        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full">
          {totalBookings} faxinas
        </span>
      </div>

      {/* Calendar grid */}
      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-7 mb-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="h-10" />;
            const isToday   = day === TODAY_DAY;
            const isBlocked = BLOCKED_DAYS.has(day);
            const booking   = BOOKINGS_MAP[day];
            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-center h-10 rounded-lg ${
                  isBlocked ? "bg-slate-100" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold leading-none ${
                    isToday ? "bg-sky-500 text-white" : "text-slate-700"
                  }`}
                >
                  {day}
                </div>
                <div className="flex gap-0.5 h-2 mt-0.5">
                  {booking?.morning   && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                  {booking?.afternoon && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">
          Próximos Agendamentos
        </p>
        <div className="space-y-3">
          {UPCOMING.map((b, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`w-2 h-2 rounded-full ${b.dot} shrink-0 mt-1.5`} />
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {b.date} · {b.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {b.period} · {b.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
          Manhã agendada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
          Tarde agendada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
          Dia bloqueado
        </span>
      </div>
    </div>
  );
}

// ─── Tab: O que seu cliente vê (static snapshot of "Your Details" step) ───────

function LinkTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Wizard header */}
      <div className="px-6 pt-8 pb-4 text-center border-b border-slate-50">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Book Your Cleaning</h3>
        <p className="text-slate-500 text-sm">With Ana Santos · Ready in under 60 seconds.</p>
      </div>

      {/* Step indicator — steps 0-2 done, step 3 (Your Details) active */}
      <div className="flex items-center gap-0 px-6 pt-6 pb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < 3
                    ? "bg-sky-500 text-white"
                    : "bg-sky-500 text-white ring-4 ring-sky-100"
                }`}
              >
                {i < 3 ? "✓" : 4}
              </div>
              <span
                className={`text-xs mt-1 font-medium hidden sm:block ${
                  i === 3 ? "text-sky-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mb-5 mx-1 bg-sky-500" />
            )}
          </div>
        ))}
      </div>

      {/* Your Details — static, pre-filled */}
      <div className="px-6 pb-6 pt-4 space-y-4">

        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-bold text-slate-700">Contact Info</p>
          {[
            { label: "Name",         value: "Jane Doe" },
            { label: "Email",        value: "jane@example.com" },
            { label: "Phone Number", value: "(512) 555-0100" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50/50">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Home Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-bold text-slate-700">Home Details</p>

          {/* Pets */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Do you have pets?</p>
            <div className="flex gap-2">
              {[
                { label: "🐕 Dog", active: true },
                { label: "🐈 Cat", active: false },
                { label: "None",   active: false },
              ].map(({ label, active }) => (
                <div
                  key={label}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-center ${
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-600"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Children */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Are there children in the house?</p>
            <div className="flex gap-2">
              {[
                { label: "Yes", active: true },
                { label: "No",  active: false },
              ].map(({ label, active }) => (
                <div
                  key={label}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-center ${
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-600"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Floor type */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Floor type</p>
            <div className="flex gap-2">
              {[
                { label: "Hardwood", active: false, badge: false },
                { label: "Tile",     active: false, badge: false },
                { label: "Carpet",   active: true,  badge: true  },
              ].map(({ label, active, badge }) => (
                <div
                  key={label}
                  className={`relative flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-center ${
                    active
                      ? "border-sky-500 bg-sky-50 text-sky-600"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {label}
                  {badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-amber-400 text-white px-1.5 rounded-full whitespace-nowrap">
                      Special
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Entry Instructions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-700 mb-2">Entry Instructions</p>
          <div className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 bg-slate-50/50 min-h-[72px]">
            Door code: 1234. Please ring the bell first.
          </div>
        </div>

        {/* Buttons — visual only */}
        <div className="flex gap-3">
          <div className="flex-1 border-2 border-slate-200 text-slate-400 font-semibold py-3 rounded-xl text-center text-sm">
            ← Back
          </div>
          <div className="flex-1 bg-sky-500 text-white font-bold py-3 rounded-xl text-center text-sm">
            Continue →
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Seus Preços (static snapshot) ───────────────────────────────────────
// Values: base $90, +$20/quarto, +$15/banheiro, Deep +$50, Move +$80
// Table computed once: no live-update

const STATIC_ROWS = [
  { label: "1 qto · 1 bnh",   reg:  90, deep: 140, move: 170 },
  { label: "2 qtos · 1 bnh",  reg: 110, deep: 160, move: 190 },
  { label: "2 qtos · 2 bnhs", reg: 125, deep: 175, move: 205 },
  { label: "3 qtos · 2 bnhs", reg: 145, deep: 195, move: 225 },
  { label: "4 qtos · 3 bnhs", reg: 180, deep: 230, move: 260 },
];

function PrecosTab() {
  return (
    <div className="space-y-4">
      {/* Precificação */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Precificação</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina seus valores — o sistema calcula automaticamente para qualquer tamanho de casa.
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Fórmula Base */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fórmula Base</p>
              <p className="text-xs text-slate-400 mt-1">
                Preço = Preço Base + (Quartos − 1) × Quarto Adicional + (Banheiros − 1) × Banheiro Adicional
              </p>
            </div>
            {[
              { label: "Preço Base (1 quarto / 1 banheiro)", prefix: "$",  value: "90" },
              { label: "Quarto adicional",                    prefix: "+$", value: "20" },
              { label: "Banheiro adicional",                  prefix: "+$", value: "15" },
            ].map(({ label, prefix, value }) => (
              <div key={label} className="flex items-center gap-4">
                <p className="flex-1 text-sm font-semibold text-slate-700 leading-snug">{label}</p>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden w-[120px] shrink-0">
                  <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">
                    {prefix}
                  </span>
                  <div className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Adicionais de Serviço */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">
                Adicionais por Tipo de Limpeza
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Cobrado além do preço base. Deep Cleaning inclui forno, geladeira e persianas.
              </p>
            </div>
            {[
              { label: "Deep Cleaning",      sub: "Forno, geladeira, persianas, rodapés",  color: "text-sky-600",    value: "50" },
              { label: "Move-in / Move-out", sub: "Deep + armários e eletrodomésticos",    color: "text-violet-600", value: "80" },
            ].map(({ label, sub, color, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${color}`}>{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden w-[120px] shrink-0">
                  <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">+$</span>
                  <div className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview table — static values */}
          <div className="pt-1 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 mb-3">
              Pré-visualização de preços
            </p>
            <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                <div className="px-3 py-2 font-bold text-slate-500">Casa</div>
                <div className="px-3 py-2 font-bold text-slate-600 text-center">Regular</div>
                <div className="px-3 py-2 font-bold text-sky-600 text-center">Deep</div>
                <div className="px-3 py-2 font-bold text-violet-600 text-center">Move-in/out</div>
              </div>
              {STATIC_ROWS.map(({ label, reg, deep, move }, i) => (
                <div
                  key={label}
                  className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <div className="px-3 py-2.5 text-slate-500">{label}</div>
                  <div className="px-3 py-2.5 font-semibold text-slate-800 text-center">${reg}</div>
                  <div className="px-3 py-2.5 font-semibold text-sky-600 text-center">${deep}</div>
                  <div className="px-3 py-2.5 font-semibold text-violet-600 text-center">${move}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Descontos por Frequência */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Descontos por Frequência</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Clientes recorrentes recebem desconto automático no preço final.
          </p>
        </div>
        <div className="px-6 py-5 grid grid-cols-3 gap-6">
          {[
            { label: "Semanal",   value: "15" },
            { label: "Quinzenal", value: "10" },
            { label: "Mensal",    value: "5"  },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white">
                  {value}
                </div>
                <span className="px-3 text-slate-400 text-sm bg-slate-50 border-l border-slate-200 py-2">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; flag: string }[] = [
  { id: "agenda", label: "Sua Agenda",          flag: "🇧🇷" },
  { id: "link",   label: "O que seu cliente vê", flag: "🇺🇸" },
  { id: "precos", label: "Seus Preços",          flag: "🇧🇷" },
];

export default function DemoTabs() {
  const [active, setActive] = useState<Tab>("agenda");

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Veja o sistema em ação
          </h2>
          <p className="text-slate-500 text-lg">
            Isso é exatamente o que você e seus clientes vão ver.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all leading-tight text-center ${
                active === tab.id
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              <span className="text-base leading-none">{tab.flag}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {active === "agenda" && <AgendaTab />}
          {active === "link"   && <LinkTab />}
          {active === "precos" && <PrecosTab />}
        </div>

      </div>
    </section>
  );
}
