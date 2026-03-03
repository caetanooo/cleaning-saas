"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "agenda" | "link" | "precos";

// ─── Agenda Tab data ──────────────────────────────────────────────────────────
// March 2026: starts on Sunday (offset = 0), 31 days, today = 3

const MARCH_START  = 0;  // Sunday
const MARCH_DAYS   = 31;
const TODAY_DAY    = 3;

const BOOKINGS_MAP: Record<number, { morning?: string; afternoon?: string }> = {
  3:  { morning: "Maria Silva" },
  4:  { morning: "Sarah Johnson", afternoon: "John Williams" },
  5:  { morning: "Emily Clark" },
  7:  { afternoon: "David Lee" },
  10: { morning: "Lisa Park" },
  12: { morning: "Tom Baker",    afternoon: "Anna Reeves" },
  17: { morning: "James Carter" },
  19: { afternoon: "Mia Turner" },
  24: { morning: "Chris Evans",  afternoon: "Kate Wills" },
};

const BLOCKED_DAYS = new Set([8, 15, 22]);

const UPCOMING = [
  { dot: "bg-sky-500",    date: "Ter, 3 de Março",  period: "Manhã (9h–13h)",     name: "Maria Silva",   address: "123 Oak St, Austin, TX" },
  { dot: "bg-sky-500",    date: "Qua, 4 de Março",  period: "Manhã (9h–13h)",     name: "Sarah Johnson", address: "456 Pine Ave, Austin, TX" },
  { dot: "bg-violet-500", date: "Qua, 4 de Março",  period: "Tarde (13h30–18h)",  name: "John Williams", address: "789 Elm Blvd, Austin, TX" },
  { dot: "bg-sky-500",    date: "Qui, 5 de Março",  period: "Manhã (9h–13h)",     name: "Emily Clark",   address: "321 Maple Dr, Austin, TX" },
];

// ─── Booking Tab data ─────────────────────────────────────────────────────────

const STEPS = ["House Size", "Frequency", "Date & Time", "Your Details"];

const SERVICE_OPTS = [
  {
    label: "Regular Cleaning",
    desc: "Thorough cleaning of all rooms.",
    price: "145.00",
    addon: null,
    active: true,
  },
  {
    label: "Deep Cleaning",
    desc: "Includes inside oven, baseboards, blinds, and windows.",
    price: "195.00",
    addon: 50,
    active: false,
  },
  {
    label: "Move-in / Move-out",
    desc: "Deep cleaning + inside appliances, cabinets, and closets.",
    price: "225.00",
    addon: 80,
    active: false,
  },
];

const FREQ_OPTS = [
  { label: "One-Time",  desc: "Single visit, no commitment",  price: "145.00", badge: "",         active: false },
  { label: "Weekly",    desc: "4 dates — once a week",         price: "123.25", badge: "Save 15%", active: false },
  { label: "Bi-Weekly", desc: "2 dates — every two weeks",     price: "130.50", badge: "Save 10%", active: true  },
  { label: "Monthly",   desc: "1 date — once a month",         price: "137.75", badge: "Save 5%",  active: false },
];

// ─── Pricing Tab helpers ──────────────────────────────────────────────────────

const PREVIEW_ROWS = [
  { beds: 1, baths: 1 },
  { beds: 2, baths: 1 },
  { beds: 2, baths: 2 },
  { beds: 3, baths: 2 },
  { beds: 4, baths: 3 },
];

function calcBase(base: number, eb: number, ebath: number, beds: number, baths: number) {
  return base + (beds - 1) * eb + (baths - 1) * ebath;
}

// ─── Tab: Sua Agenda ──────────────────────────────────────────────────────────

function AgendaTab() {
  // Build flat array of cells (null = empty padding, number = day of month)
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
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
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
                    isToday
                      ? "bg-sky-500 text-white"
                      : "text-slate-700"
                  }`}
                >
                  {day}
                </div>
                {/* Booking dots */}
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

// ─── Tab: O que seu cliente vê ────────────────────────────────────────────────

type PetOption   = "dog" | "cat" | "none";
type FloorOption = "hardwood" | "tile" | "carpet";

function LinkTab() {
  const [step,     setStep]     = useState(0);
  // Step 2 form state
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [pets,     setPets]     = useState<PetOption>("none");
  const [children, setChildren] = useState(false);
  const [floor,    setFloor]    = useState<FloorOption>("hardwood");
  const [entry,    setEntry]    = useState("");

  // Map internal step to wizard visual step index
  // step 0 → viz 0, step 1 → viz 1, step 2 → viz 3 (skip Date & Time, show done)
  const vizStep = step < 2 ? step : 3;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Wizard header — exact from WizardClient.tsx */}
      <div className="px-6 pt-8 pb-4 text-center border-b border-slate-50">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Book Your Cleaning</h3>
        <p className="text-slate-500 text-sm">With Ana Santos · Ready in under 60 seconds.</p>
      </div>

      {/* Step indicator — hidden on summary screen */}
      {step < 3 && (
        <div className="flex items-center gap-0 px-6 pt-6 pb-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < vizStep
                      ? "bg-sky-500 text-white"
                      : i === vizStep
                      ? "bg-sky-500 text-white ring-4 ring-sky-100"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {i < vizStep ? "✓" : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium hidden sm:block ${i === vizStep ? "text-sky-600" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < vizStep ? "bg-sky-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 0: House Size + Service Type — exact from WizardClient.tsx */}
      {step === 0 && (
        <div className="px-6 pb-6 pt-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            {/* Bedrooms */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Bedrooms</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold text-center ${
                      n === 3
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {n === 5 ? "5+" : n}
                  </div>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Bathrooms</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold text-center ${
                      n === 2
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {n === 5 ? "5+" : n}
                  </div>
                ))}
              </div>
            </div>

            {/* Service Type */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-700 mb-3">Service Type</p>
              <div className="space-y-2">
                {SERVICE_OPTS.map((opt) => (
                  <div
                    key={opt.label}
                    className={`w-full text-left border-2 rounded-xl px-4 py-3 ${
                      opt.active ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
                          {opt.addon && (
                            <span className="text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                              +${opt.addon}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-sky-600">${opt.price}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">per session</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 1: Frequency */}
      {step === 1 && (
        <div className="px-6 pb-6 pt-4 space-y-6">
          <div className="space-y-3">
            {FREQ_OPTS.map((opt) => (
              <div
                key={opt.label}
                className={`w-full text-left border-2 rounded-2xl px-5 py-4 ${
                  opt.active ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-sky-600">${opt.price}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">per session</p>
                    {opt.badge && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Your Details — exact design from WizardClient.tsx step 3 */}
      {step === 2 && (
        <div className="px-6 pb-6 pt-4 space-y-4">

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <p className="text-sm font-bold text-slate-700">Contact Info</p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(512) 555-0100"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Home Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <p className="text-sm font-bold text-slate-700">Home Details</p>

            {/* Pets */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Do you have pets?</p>
              <div className="flex gap-2">
                {(["dog", "cat", "none"] as PetOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPets(opt)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      pets === opt
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-200 text-slate-500 hover:border-sky-300"
                    }`}
                  >
                    {opt === "dog" ? "🐕 Dog" : opt === "cat" ? "🐈 Cat" : "None"}
                  </button>
                ))}
              </div>
            </div>

            {/* Children */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Are there children in the house?</p>
              <div className="flex gap-2">
                {([true, false] as const).map((opt) => (
                  <button
                    key={String(opt)}
                    type="button"
                    onClick={() => setChildren(opt)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      children === opt
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-200 text-slate-500 hover:border-sky-300"
                    }`}
                  >
                    {opt ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>

            {/* Floor type */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Floor type</p>
              <div className="flex gap-2">
                {(["hardwood", "tile", "carpet"] as FloorOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFloor(opt)}
                    className={`relative flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-colors ${
                      floor === opt
                        ? "border-sky-500 bg-sky-50 text-sky-600"
                        : "border-slate-200 text-slate-500 hover:border-sky-300"
                    }`}
                  >
                    {opt === "carpet" ? "Carpet" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    {opt === "carpet" && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-amber-400 text-white px-1.5 rounded-full whitespace-nowrap">
                        Special
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Entry Instructions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">Entry Instructions</label>
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="How should we enter the house? (e.g., door code, key under mat…)"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Booking Summary */}
      {step === 3 && (
        <div className="px-6 pb-8 pt-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-sky-600">
              ✓
            </div>
            <p className="font-extrabold text-slate-900 text-lg">Your Booking Summary</p>
            <p className="text-sm text-slate-500">Here&apos;s everything we&apos;ll need before your first visit.</p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 text-sm overflow-hidden">
            <div className="flex justify-between px-5 py-3 bg-white">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-slate-800">Regular Cleaning</span>
            </div>
            <div className="flex justify-between px-5 py-3 bg-white">
              <span className="text-slate-500">Frequency</span>
              <span className="font-semibold text-slate-800">
                Bi-Weekly{" "}
                <span className="text-green-600 text-xs font-bold">(Save 10%)</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline px-5 py-3 bg-white">
              <span className="text-slate-500">Price / session</span>
              <span className="font-extrabold text-sky-600 text-base">$130.50</span>
            </div>
            <div className="px-5 py-3 bg-slate-50/60">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide block mb-2">
                Home Details
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pets !== "none" && (
                  <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                    {pets === "dog" ? "🐕 Dog" : "🐈 Cat"}
                  </span>
                )}
                {children && (
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    👶 Children
                  </span>
                )}
                {floor === "carpet" && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    🪞 Carpet floor
                  </span>
                )}
                {floor !== "carpet" && pets === "none" && !children && (
                  <span className="text-xs text-slate-400">Standard home</span>
                )}
              </div>
              {entry && (
                <p className="text-xs text-slate-400 italic mt-2">
                  &ldquo;{entry.length > 50 ? entry.slice(0, 50) + "…" : entry}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/cleaner/signup"
            className="block w-full text-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-colors text-base"
          >
            Get your own booking link →
          </Link>

          <button
            onClick={() => setStep(0)}
            className="w-full text-center text-slate-400 text-sm hover:text-slate-600 transition-colors py-1"
          >
            ← Start over
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Seus Preços ─────────────────────────────────────────────────────────

function PrecosTab() {
  const [base,      setBase]      = useState("90");
  const [extraBed,  setExtraBed]  = useState("20");
  const [extraBath, setExtraBath] = useState("15");
  const [deep,      setDeep]      = useState("50");
  const [move,      setMove]      = useState("80");

  const bNum    = parseFloat(base)      || 0;
  const ebNum   = parseFloat(extraBed)  || 0;
  const ebatNum = parseFloat(extraBath) || 0;
  const dNum    = parseFloat(deep)      || 0;
  const mNum    = parseFloat(move)      || 0;

  return (
    <div className="space-y-4">
      {/* Precificação — exact from setup/page.tsx */}
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
              { label: "Preço Base (1 quarto / 1 banheiro)", prefix: "$",  val: base,      set: setBase      },
              { label: "Quarto adicional",                    prefix: "+$", val: extraBed,  set: setExtraBed  },
              { label: "Banheiro adicional",                  prefix: "+$", val: extraBath, set: setExtraBath },
            ].map(({ label, prefix, val, set }) => (
              <div key={label} className="flex items-center gap-4">
                <label className="flex-1 text-sm font-semibold text-slate-700 leading-snug">{label}</label>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 w-[120px] shrink-0">
                  <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">
                    {prefix}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => set(e.target.value)}
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">
                Adicionais por Tipo de Limpeza
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Cobrado além do preço base. Deep Cleaning inclui forno, geladeira e persianas.
              </p>
            </div>
            {[
              { label: "Deep Cleaning",      sub: "Forno, geladeira, persianas, rodapés",  color: "text-sky-600",    val: deep, set: setDeep },
              { label: "Move-in / Move-out", sub: "Deep + armários e eletrodomésticos",    color: "text-violet-600", val: move, set: setMove },
            ].map(({ label, sub, color, val, set }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className={`text-sm font-semibold ${color}`}>{label}</label>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 w-[120px] shrink-0">
                  <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">+$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live preview table — exact from setup/page.tsx */}
          <div className="pt-1 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 mb-3">
              Pré-visualização ao vivo
            </p>
            <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                <div className="px-3 py-2 font-bold text-slate-500">Casa</div>
                <div className="px-3 py-2 font-bold text-slate-600 text-center">Regular</div>
                <div className="px-3 py-2 font-bold text-sky-600 text-center">Deep</div>
                <div className="px-3 py-2 font-bold text-violet-600 text-center">Move-in/out</div>
              </div>
              {PREVIEW_ROWS.map(({ beds, baths }, i) => {
                const reg = calcBase(bNum, ebNum, ebatNum, beds, baths);
                const dp  = reg + dNum;
                const mv  = reg + mNum;
                return (
                  <div
                    key={`${beds}-${baths}`}
                    className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <div className="px-3 py-2.5 text-slate-500">
                      {beds} {beds > 1 ? "qtos" : "qto"} · {baths} {baths > 1 ? "bnhs" : "bnh"}
                    </div>
                    <div className="px-3 py-2.5 font-semibold text-slate-800 text-center">${reg.toFixed(0)}</div>
                    <div className="px-3 py-2.5 font-semibold text-sky-600 text-center">${dp.toFixed(0)}</div>
                    <div className="px-3 py-2.5 font-semibold text-violet-600 text-center">${mv.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              ✓ Edite os valores acima e a tabela atualiza em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* Descontos por Frequência — exact from setup/page.tsx */}
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={value}
                  className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                />
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
  { id: "agenda", label: "Sua Agenda",             flag: "🇧🇷" },
  { id: "link",   label: "O que seu cliente vê",    flag: "🇺🇸" },
  { id: "precos", label: "Seus Preços",             flag: "🇧🇷" },
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

        {/* Tab buttons — grid-cols-3 so each is exactly 1/3 on all screens */}
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
