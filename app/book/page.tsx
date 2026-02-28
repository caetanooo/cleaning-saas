"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Cleaner, Booking, FrequencyType, TimeBlock, BlockAvailability, CleaningServiceType, DayOfWeek } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["House Size", "Frequency", "Date & Time", "Your Details"];

const FREQ_OPTIONS: { value: FrequencyType; label: string; description: string }[] = [
  { value: "one_time",  label: "One-Time",  description: "Single visit, no commitment" },
  { value: "weekly",    label: "Weekly",    description: "Every week, same day" },
  { value: "biweekly",  label: "Bi-Weekly", description: "Every two weeks" },
  { value: "monthly",   label: "Monthly",   description: "Once a month" },
];

const SERVICE_OPTIONS: { value: CleaningServiceType; label: string; description: string }[] = [
  { value: "regular", label: "Regular Cleaning",  description: "Thorough cleaning of all rooms." },
  { value: "deep",    label: "Deep Cleaning",      description: "Includes inside oven, baseboards, blinds, and windows." },
  { value: "move",    label: "Move-in / Move-out", description: "Deep cleaning + inside appliances, cabinets, and closets." },
];

const SERVICE_LABELS: Record<CleaningServiceType, string> = {
  regular: "Regular Cleaning",
  deep:    "Deep Cleaning",
  move:    "Move-in / Move-out",
};

const BLOCK_INFO: Record<TimeBlock, { label: string; start: string }> = {
  morning:   { label: "Morning",   start: "9:00 AM" },
  afternoon: { label: "Afternoon", start: "2:00 PM" },
};

// Sunday=0 … Saturday=6 → our DayOfWeek union
const JS_TO_DAY: DayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPrice(
  cleaner: Cleaner | null,
  beds: number | null,
  baths: number | null,
  freq: FrequencyType | null,
  service: CleaningServiceType = "regular",
): number | null {
  if (!cleaner || beds === null || baths === null) return null;
  const { base, extraPerBedroom, extraPerBathroom } = cleaner.pricingFormula;
  const baseTotal = base + (beds - 1) * extraPerBedroom + (baths - 1) * extraPerBathroom;
  const addon = service === "deep" ? (cleaner.serviceAddons?.deep ?? 0)
              : service === "move" ? (cleaner.serviceAddons?.move ?? 0)
              : 0;
  const total = baseTotal + addon;
  if (!freq || freq === "one_time") return total;
  const { frequencyDiscounts: fd } = cleaner;
  const pct =
    freq === "weekly"   ? fd.weekly   :
    freq === "biweekly" ? fd.biweekly : fd.monthly;
  return Math.round(total * (1 - pct / 100) * 100) / 100;
}

function discountLabel(cleaner: Cleaner, freq: FrequencyType): string {
  if (freq === "one_time") return "";
  const { frequencyDiscounts: fd } = cleaner;
  const pct =
    freq === "weekly"   ? fd.weekly   :
    freq === "biweekly" ? fd.biweekly : fd.monthly;
  return pct > 0 ? `Save ${pct}%` : "";
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Week-view day list ───────────────────────────────────────────────────────

interface DayCard {
  dateStr:   string;   // "YYYY-MM-DD"
  dayName:   string;   // "Mon"
  dayNum:    number;   // 27
  monthName: string;   // "Feb"
  isOff:     boolean;  // cleaner not working that day of week
  isToday:   boolean;
}

function computeNextDays(cleaner: Cleaner, count = 30): DayCard[] {
  const cards: DayCard[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const avail   = cleaner.availability[JS_TO_DAY[d.getDay()]];
    const dateStr = d.toISOString().split("T")[0];
    cards.push({
      dateStr,
      dayName:   d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum:    d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
      isOff:     (!avail.morning && !avail.afternoon) || (cleaner.blockedDates ?? []).includes(dateStr),
      isToday:   i === 0,
    });
  }
  return cards;
}

// ─── SMS body: only what the client filled in ─────────────────────────────────

function buildSmsBody(booking: Booking, serviceType: CleaningServiceType): string {
  const freqMap: Record<FrequencyType, string> = {
    one_time: "One-Time",
    weekly:   "Weekly",
    biweekly: "Bi-Weekly",
    monthly:  "Monthly",
  };
  const block = BLOCK_INFO[booking.timeBlock];
  const beds  = booking.bedrooms  === 5 ? "5+" : booking.bedrooms;
  const baths = booking.bathrooms === 5 ? "5+" : booking.bathrooms;
  return [
    `Name: ${booking.customerName}`,
    `Date: ${formatDate(booking.date)}`,
    `Preferred Time: ${block.label} starting at ${block.start}`,
    `Address: ${booking.customerAddress}`,
    `Service: ${SERVICE_LABELS[serviceType]} — ${beds} bed · ${baths} bath — ${freqMap[booking.frequency]}`,
    `Notes: Pets: ${booking.hasPets ? "Yes" : "No"}`,
  ].join("\n");
}

// ─── State ────────────────────────────────────────────────────────────────────

interface WizardState {
  step: number;
  bedrooms: number | null;
  bathrooms: number | null;
  serviceType: CleaningServiceType;
  frequency: FrequencyType | null;
  date: string;
  timeBlock: TimeBlock | null;
  blockAvail: BlockAvailability | null;
  blockLoading: boolean;
  blockError: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  hasPets: boolean;
  submitting: boolean;
  submitError: string;
  confirmedBooking: Booking | null;
  messengerCopied: boolean;
}

const INITIAL: WizardState = {
  step: 0,
  bedrooms: null,
  bathrooms: null,
  serviceType: "regular",
  frequency: null,
  date: "",
  timeBlock: null,
  blockAvail: null,
  blockLoading: false,
  blockError: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  hasPets: false,
  submitting: false,
  submitError: "",
  confirmedBooking: null,
  messengerCopied: false,
};

// ─── Inner page (needs useSearchParams) ───────────────────────────────────────

function BookPageInner() {
  const searchParams = useSearchParams();
  const cleanerId = searchParams.get("cleanerId") ?? "cleaner-1";

  const [cleaner, setCleaner]               = useState<Cleaner | null>(null);
  const [cleanerLoading, setCleanerLoading] = useState(true);
  const [state, setState]                   = useState<WizardState>(INITIAL);

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  useEffect(() => {
    fetch(`/api/cleaners/${cleanerId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: Cleaner | null) => {
        if (data?.id) setCleaner(data);
        setCleanerLoading(false);
      })
      .catch(() => setCleanerLoading(false));
  }, [cleanerId]);

  const price    = calcPrice(cleaner, state.bedrooms, state.bathrooms, state.frequency, state.serviceType);
  const nextDays = cleaner ? computeNextDays(cleaner) : [];

  // ── Step 0 → 1 ──────────────────────────────────────────────────────────────
  function goStep1() {
    if (state.bedrooms === null || state.bathrooms === null) return;
    update({ step: 1 });
  }

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────────
  function goStep2() {
    if (!state.frequency) return;
    update({ step: 2, date: "", timeBlock: null, blockAvail: null, blockError: "" });
  }

  // ── Step 2: date change ──────────────────────────────────────────────────────
  async function handleDateChange(date: string) {
    if (!date) return;
    update({ date, timeBlock: null, blockAvail: null, blockLoading: true, blockError: "" });
    try {
      const res = await fetch(`/api/availability?cleanerId=${cleanerId}&date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check availability");
      update({ blockAvail: data as BlockAvailability, blockLoading: false });
    } catch (err) {
      update({ blockLoading: false, blockError: (err as Error).message });
    }
  }

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────────
  function goStep3() {
    if (!state.timeBlock) return;
    update({ step: 3, submitError: "" });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.frequency || !state.timeBlock || state.bedrooms === null || state.bathrooms === null) return;
    update({ submitting: true, submitError: "" });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanerId,
          customerName:    state.customerName.trim(),
          customerPhone:   state.customerPhone.trim(),
          customerAddress: state.customerAddress.trim(),
          hasPets:         state.hasPets,
          bedrooms:        state.bedrooms,
          bathrooms:       state.bathrooms,
          serviceType:     state.serviceType,
          frequency:       state.frequency,
          date:            state.date,
          timeBlock:       state.timeBlock,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        update({
          submitting: false,
          step: 2,
          timeBlock: null,
          blockAvail: null,
          blockError: "That slot was just taken. Please pick another time.",
        });
        handleDateChange(state.date);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      update({ submitting: false, step: 4, confirmedBooking: data as Booking });
    } catch (err) {
      update({ submitting: false, submitError: (err as Error).message });
    }
  }

  // ── Messenger: copy details then open m.me ───────────────────────────────────
  async function handleMessenger() {
    if (!state.confirmedBooking || !cleaner?.messengerUsername) return;
    await navigator.clipboard.writeText(buildSmsBody(state.confirmedBooking, state.serviceType));
    update({ messengerCopied: true });
    setTimeout(() => update({ messengerCopied: false }), 5000);
    window.open(`https://m.me/${cleaner.messengerUsername}`, "_blank");
  }

  // ── Size selection button ────────────────────────────────────────────────────
  function SizeBtn({
    value, selected, label, onClick,
  }: { value: number; selected: boolean; label: string; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-colors ${
          selected
            ? "border-sky-500 bg-sky-50 text-sky-600"
            : "border-slate-200 text-slate-600 hover:border-sky-300"
        }`}
      >
        {label}
      </button>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (cleanerLoading || !cleaner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">
          {cleanerLoading ? "Loading…" : "Could not load cleaner. Check the booking link."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-800">CleanClick</span>
          </Link>
          <span className="text-sm text-slate-500">Booking</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 text-center mb-2">
          Book Your Cleaning
        </h1>
        <p className="text-slate-500 text-center mb-10 text-sm">
          With {cleaner.name} · Ready in under 60 seconds.
        </p>

        {/* Step indicator */}
        {state.step < 4 && (
          <div className="flex items-center gap-0 mb-10">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i < state.step
                        ? "bg-sky-500 text-white"
                        : i === state.step
                        ? "bg-sky-500 text-white ring-4 ring-sky-100"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {i < state.step ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${
                    i === state.step ? "text-sky-600" : "text-slate-400"
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-5 mx-1 transition-colors ${
                    i < state.step ? "bg-sky-500" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 0: House Size + Service Type ── */}
        {state.step === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              {/* Bedrooms */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Bedrooms</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SizeBtn
                      key={n}
                      value={n}
                      label={n === 5 ? "5+" : String(n)}
                      selected={state.bedrooms === n}
                      onClick={() => update({ bedrooms: n })}
                    />
                  ))}
                </div>
              </div>
              {/* Bathrooms */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Bathrooms</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SizeBtn
                      key={n}
                      value={n}
                      label={n === 5 ? "5+" : String(n)}
                      selected={state.bathrooms === n}
                      onClick={() => update({ bathrooms: n })}
                    />
                  ))}
                </div>
              </div>
              {/* Service Type */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-700 mb-3">Service Type</p>
                <div className="space-y-2">
                  {SERVICE_OPTIONS.map((opt) => {
                    const svcPrice = calcPrice(cleaner, state.bedrooms, state.bathrooms, null, opt.value);
                    const addonAmt = opt.value === "deep" ? cleaner.serviceAddons?.deep
                                   : opt.value === "move" ? cleaner.serviceAddons?.move
                                   : null;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update({ serviceType: opt.value })}
                        className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-colors ${
                          state.serviceType === opt.value
                            ? "border-sky-500 bg-sky-50"
                            : "border-slate-200 bg-white hover:border-sky-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
                              {addonAmt != null && addonAmt > 0 && (
                                <span className="text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                                  +${addonAmt}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                          </div>
                          {svcPrice !== null && (
                            <p className="text-lg font-extrabold text-sky-600 shrink-0">
                              ${svcPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={goStep1}
              disabled={state.bedrooms === null || state.bathrooms === null}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-lg"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 1: Frequency ── */}
        {state.step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              {FREQ_OPTIONS.map((opt) => {
                const optPrice = calcPrice(cleaner, state.bedrooms, state.bathrooms, opt.value, state.serviceType);
                const disc = discountLabel(cleaner, opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ frequency: opt.value })}
                    className={`w-full text-left border-2 rounded-2xl px-5 py-4 transition-colors ${
                      state.frequency === opt.value
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                      </div>
                      <div className="text-right">
                        {optPrice !== null && (
                          <p className="text-xl font-extrabold text-sky-600">
                            ${optPrice.toFixed(2)}
                          </p>
                        )}
                        {disc && (
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {disc}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => update({ step: 0 })}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={goStep2}
                disabled={!state.frequency}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Date & Time Block ── */}
        {state.step === 2 && (
          <div className="space-y-6">
            {state.blockError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {state.blockError}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Select a Date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {nextDays.map((d) => {
                  const isSelected = state.date === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      disabled={d.isOff}
                      onClick={() => !d.isOff && handleDateChange(d.dateStr)}
                      className={`flex flex-col items-center rounded-xl border-2 py-3 px-2.5 min-w-[56px] shrink-0 transition-colors ${
                        d.isOff
                          ? "border-slate-100 bg-slate-50 cursor-not-allowed"
                          : isSelected
                          ? "border-sky-500 bg-sky-500"
                          : "border-slate-200 bg-white hover:border-sky-300"
                      }`}
                    >
                      <span className={`text-[10px] font-semibold leading-none mb-1 ${
                        d.isOff ? "text-slate-300" : isSelected ? "text-sky-100" : "text-slate-400"
                      }`}>
                        {d.isToday ? "Today" : d.dayName}
                      </span>
                      <span className={`text-lg font-extrabold leading-tight ${
                        d.isOff ? "text-slate-300" : isSelected ? "text-white" : "text-slate-800"
                      }`}>
                        {d.dayNum}
                      </span>
                      <span className={`text-[10px] leading-none mt-1 ${
                        d.isOff ? "text-slate-300" : isSelected ? "text-sky-100" : "text-slate-400"
                      }`}>
                        {d.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {state.blockLoading && (
              <p className="text-center text-slate-500 text-sm py-4 animate-pulse">
                Checking availability…
              </p>
            )}

            {!state.blockLoading && state.blockAvail && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Select a Time Block</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["morning", "afternoon"] as TimeBlock[]).map((block) => {
                    const avail = state.blockAvail![block];
                    const info  = BLOCK_INFO[block];
                    return (
                      <button
                        key={block}
                        type="button"
                        disabled={!avail}
                        onClick={() => avail && update({ timeBlock: block })}
                        className={`border-2 rounded-2xl px-4 py-5 text-center transition-colors ${
                          !avail
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : state.timeBlock === block
                            ? "border-sky-500 bg-sky-50"
                            : "border-slate-200 bg-white hover:border-sky-300"
                        }`}
                      >
                        <p className={`font-bold text-base ${avail ? "text-slate-800" : "text-slate-300"}`}>
                          {info.label}
                        </p>
                        <p className={`text-xs mt-1 ${avail ? "text-slate-500" : "text-slate-300"}`}>
                          Starts at {info.start}
                        </p>
                        {!avail && (
                          <p className="text-xs mt-2 text-slate-300 italic">Unavailable</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!state.blockLoading && state.blockAvail &&
              !state.blockAvail.morning && !state.blockAvail.afternoon && (
              <p className="text-center text-slate-400 text-sm py-2">
                No availability on this date. Please try another day.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => update({ step: 1 })}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={goStep3}
                disabled={!state.timeBlock}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact Info ── */}
        {state.step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {state.submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {state.submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={state.customerName}
                onChange={(e) => update({ customerName: e.target.value })}
                placeholder="Jane Doe"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={state.customerPhone}
                onChange={(e) => update({ customerPhone: e.target.value })}
                placeholder="(512) 555-0100"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Home Address</label>
              <input
                type="text"
                required
                value={state.customerAddress}
                onChange={(e) => update({ customerAddress: e.target.value })}
                placeholder="123 Main St, Austin, TX 78701"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <p className="block text-sm font-semibold text-slate-700 mb-2">Do you have pets?</p>
              <div className="flex gap-4">
                {[{ label: "Yes", value: true }, { label: "No", value: false }].map(({ label, value }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasPets"
                      checked={state.hasPets === value}
                      onChange={() => update({ hasPets: value })}
                      className="accent-sky-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price summary */}
            {price !== null && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-4 text-sm space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>
                    {SERVICE_LABELS[state.serviceType]} ·{" "}
                    {state.bedrooms === 5 ? "5+" : state.bedrooms} bed ·{" "}
                    {state.bathrooms === 5 ? "5+" : state.bathrooms} bath
                  </span>
                  <span className="capitalize">{state.frequency?.replace("_", "-")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">
                    {state.date && BLOCK_INFO[state.timeBlock!]
                      ? `${formatDate(state.date)} · ${BLOCK_INFO[state.timeBlock!].label}`
                      : ""}
                  </span>
                  <span className="font-extrabold text-sky-600 text-base">${price.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => update({ step: 2 })}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={state.submitting}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {state.submitting ? "Confirming…" : "Confirm Booking →"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 4: Confirmed ── */}
        {state.step === 4 && state.confirmedBooking && (
          <div className="space-y-5">
            {/* Success header */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ✓
              </div>
              <p className="font-extrabold text-green-800 text-lg">Booking Confirmed!</p>
              <p className="text-xs text-green-600 mt-1">ID: {state.confirmedBooking.id}</p>
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 divide-y divide-slate-100">
              {[
                ["Service", SERVICE_LABELS[state.serviceType]],
                [
                  "Home",
                  `${state.confirmedBooking.bedrooms === 5 ? "5+" : state.confirmedBooking.bedrooms} bed · ${
                    state.confirmedBooking.bathrooms === 5 ? "5+" : state.confirmedBooking.bathrooms
                  } bath`,
                ],
                [
                  "Frequency",
                  FREQ_OPTIONS.find((f) => f.value === state.confirmedBooking!.frequency)?.label ?? "",
                ],
                ["Date", formatDate(state.confirmedBooking.date)],
                [
                  "Time",
                  `${BLOCK_INFO[state.confirmedBooking.timeBlock].label} (Starts at ${BLOCK_INFO[state.confirmedBooking.timeBlock].start})`,
                ],
                ["Address", state.confirmedBooking.customerAddress],
                ["Phone", state.confirmedBooking.customerPhone],
                ["Pets", state.confirmedBooking.hasPets ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-extrabold text-sky-600 text-base">
                  ${state.confirmedBooking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {/* SMS */}
              {cleaner.phone ? (
                <a
                  href={`sms:${cleaner.phone}?body=${encodeURIComponent(buildSmsBody(state.confirmedBooking, state.serviceType))}`}
                  className="w-full font-bold py-4 rounded-2xl transition-colors text-base bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-2"
                >
                  Send via Text Message (SMS)
                </a>
              ) : null}

              {/* Facebook Messenger */}
              {cleaner.messengerUsername ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleMessenger}
                    className="w-full font-bold py-4 rounded-2xl transition-colors text-base bg-[#1877F2] hover:bg-[#1464d8] text-white flex items-center justify-center gap-2"
                  >
                    Send via Facebook Messenger
                  </button>
                  {state.messengerCopied && (
                    <p className="text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                      Details copied! Paste them in the Messenger chat.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Fallback if neither channel is set */}
              {!cleaner.phone && !cleaner.messengerUsername && (
                <p className="text-center text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                  Contact your cleaner directly to confirm the booking details.
                </p>
              )}
            </div>

            <button
              onClick={() => setState(INITIAL)}
              className="w-full border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors"
            >
              Book Another Cleaning
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Page export wrapped in Suspense for useSearchParams ──────────────────────

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-500 animate-pulse">Loading…</p>
        </div>
      }
    >
      <BookPageInner />
    </Suspense>
  );
}
