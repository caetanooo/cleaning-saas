"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneField from "@/components/PhoneField";
import type {
  Cleaner,
  FrequencyType,
  TimeBlock,
  BlockAvailability,
  CleaningServiceType,
  DayOfWeek,
} from "@/types";

// Minimal server response from POST /api/bookings — no customer PII
type ConfirmedSlot = {
  id:         string;
  date:       string;
  timeBlock:  TimeBlock;
  totalPrice: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["House Details", "Frequency", "Date & Time", "Your Details"];

const REQUIRED_DATES: Record<FrequencyType, number> = {
  one_time: 1,
  weekly:   4,
  biweekly: 2,
  monthly:  1,
};

const FREQ_OPTIONS: { value: FrequencyType; label: string; description: string }[] = [
  { value: "one_time",  label: "One-Time",   description: "Single visit, no commitment" },
  { value: "weekly",    label: "Weekly",     description: "4 dates — once a week" },
  { value: "biweekly",  label: "Bi-Weekly",  description: "2 dates — every two weeks" },
  { value: "monthly",   label: "Monthly",    description: "1 date — once a month" },
];

const SERVICE_OPTIONS: { value: CleaningServiceType; label: string; description: string }[] = [
  { value: "regular", label: "Regular Cleaning",  description: "Thorough cleaning of all rooms." },
  { value: "deep",    label: "Deep Cleaning",     description: "Includes inside oven, baseboards, blinds, and windows." },
  { value: "move",    label: "Move-in / Move-out",description: "Deep cleaning + inside appliances, cabinets, and closets." },
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

const JS_TO_DAY: DayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPrice(
  cleaner: Cleaner,
  beds: number | null,
  baths: number | null,
  freq: FrequencyType | null,
  service: CleaningServiceType = "regular",
): number | null {
  if (beds === null || baths === null) return null;
  const { base, extraPerBedroom, extraPerBathroom } = cleaner.pricingFormula;
  const baseTotal = base + (beds - 1) * extraPerBedroom + (baths - 1) * extraPerBathroom;
  const addon =
    service === "deep" ? (cleaner.serviceAddons?.deep ?? 0) :
    service === "move" ? (cleaner.serviceAddons?.move ?? 0) : 0;
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

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ─── Week-view helpers ────────────────────────────────────────────────────────

interface DayCard {
  dateStr:   string;
  dayName:   string;
  dayNum:    number;
  monthName: string;
  isOff:     boolean;
  isToday:   boolean;
  isPast:    boolean;
}

function getWeekStart(weekOffset: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday + weekOffset * 7);
  return monday;
}

function computeWeekDays(cleaner: Cleaner, weekOffset: number): DayCard[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(weekOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const avail   = cleaner.availability[JS_TO_DAY[d.getDay()]];
    const dateStr = d.toISOString().split("T")[0];
    const isPast  = d < today;
    return {
      dateStr,
      dayName:   d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum:    d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
      isOff:     isPast || (!avail.morning && !avail.afternoon) || (cleaner.blockedDates ?? []).includes(dateStr),
      isToday:   d.getTime() === today.getTime(),
      isPast,
    };
  });
}

function getWeekLabel(weekOffset: number): string {
  const weekStart = getWeekStart(weekOffset);
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
  const endMonth   = weekEnd.toLocaleDateString("en-US",   { month: "short" });
  const year       = weekEnd.getFullYear();
  return startMonth === endMonth
    ? `${startMonth} ${year}`
    : `${startMonth} – ${endMonth} ${year}`;
}

// ─── SMS body ────────────────────────────────────────────────────────────────

function buildSmsBody(slots: ConfirmedSlot[], state: WizardState): string {
  const freqMap: Record<FrequencyType, string> = {
    one_time: "One-Time",
    weekly:   "Weekly",
    biweekly: "Bi-Weekly",
    monthly:  "Monthly",
  };
  const beds      = state.bedrooms  === 5 ? "5+" : String(state.bedrooms);
  const baths     = state.bathrooms === 5 ? "5+" : String(state.bathrooms);
  const dateLines = slots
    .map(b => `  ${formatDate(b.date)} · ${BLOCK_INFO[b.timeBlock].label} (${BLOCK_INFO[b.timeBlock].start})`)
    .join("\n");
  return [
    `Name: ${state.customerName}`,
    `Dates:\n${dateLines}`,
    `Address: ${state.customerAddress}`,
    `Service: ${SERVICE_LABELS[state.serviceType]} — ${beds} bed · ${baths} bath — ${freqMap[state.frequency!]}`,
    `Notes: Pets: ${state.hasPets ? "Yes" : "No"} | Children: ${state.hasChildren ? "Yes" : "No"} | Carpet: ${state.hasCarpet ? "Yes" : "No"}`,
  ].join("\n");
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BedIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18v2" /><path d="M21 18v2" />
      <path d="M3 12V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5" />
      <rect x="6" y="10" width="4" height="2" rx="0.5" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6V4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1" />
      <path d="M3 11h18v1a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-1z" />
      <line x1="7" y1="19" x2="7" y2="21" />
      <line x1="17" y1="19" x2="17" y2="21" />
    </svg>
  );
}

function BroomIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l6-6" />
      <path d="M17 3L9 15l6 6L21 9a6 6 0 0 0-4-6z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
      <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </svg>
  );
}

const SERVICE_ICONS: Record<CleaningServiceType, React.ReactNode> = {
  regular: <BroomIcon />,
  deep:    <SparklesIcon />,
  move:    <BoxIcon />,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface WizardState {
  step:              number;
  bedrooms:          number | null;
  bathrooms:         number | null;
  serviceType:       CleaningServiceType;
  frequency:         FrequencyType | null;
  selectedDates:     Array<{ dateStr: string; timeBlock: TimeBlock }>;
  activeDate:        string | null;
  activeDateAvail:   BlockAvailability | null;
  activeDateLoading: boolean;
  blockError:        string;
  weekOffset:        number;
  customerName:      string;
  customerPhone:     string;
  customerAddress:   string;
  customerCity:      string;
  customerState:     string;
  customerZip:       string;
  specialInstructions: string;
  hasPets:           boolean;
  hasChildren:       boolean;
  hasCarpet:         boolean;
  submitting:        boolean;
  submitError:       string;
  confirmedBookings: ConfirmedSlot[];
  messengerCopied:   boolean;
}

const INITIAL: WizardState = {
  step:              0,
  bedrooms:          null,
  bathrooms:         null,
  serviceType:       "regular",
  frequency:         null,
  selectedDates:     [],
  activeDate:        null,
  activeDateAvail:   null,
  activeDateLoading: false,
  blockError:        "",
  weekOffset:        0,
  customerName:      "",
  customerPhone:     "",
  customerAddress:   "",
  customerCity:      "",
  customerState:     "",
  customerZip:       "",
  specialInstructions: "",
  hasPets:           false,
  hasChildren:       false,
  hasCarpet:         false,
  submitting:        false,
  submitError:       "",
  confirmedBookings: [],
  messengerCopied:   false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WizardClient({ cleaner }: { cleaner: Cleaner }) {
  const cleanerId = cleaner.id;
  const [state, setState] = useState<WizardState>(INITIAL);

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const price    = calcPrice(cleaner, state.bedrooms, state.bathrooms, state.frequency, state.serviceType);
  const required = state.frequency ? REQUIRED_DATES[state.frequency] : 1;
  const weekDays = computeWeekDays(cleaner, state.weekOffset);

  const fullAddress = [
    state.customerAddress,
    state.customerCity,
    [state.customerState, state.customerZip].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");

  // ─── Navigation ──────────────────────────────────────────────────────────

  function goStep1() {
    if (state.bedrooms === null || state.bathrooms === null) return;
    update({ step: 1 });
  }

  function goStep2() {
    if (!state.frequency) return;
    update({ step: 2, selectedDates: [], activeDate: null, activeDateAvail: null, blockError: "" });
  }

  async function handleDateClick(dateStr: string) {
    if (state.selectedDates.some((d) => d.dateStr === dateStr)) {
      update({ selectedDates: state.selectedDates.filter((d) => d.dateStr !== dateStr) });
      return;
    }
    if (state.selectedDates.length >= required) return;
    if (state.activeDate === dateStr) {
      update({ activeDate: null, activeDateAvail: null });
      return;
    }
    update({ activeDate: dateStr, activeDateAvail: null, activeDateLoading: true, blockError: "" });
    try {
      const res  = await fetch(`/api/availability?cleanerId=${cleanerId}&date=${dateStr}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to check availability");
      update({ activeDateAvail: data as BlockAvailability, activeDateLoading: false });
    } catch (err) {
      update({ activeDateLoading: false, blockError: (err as Error).message });
    }
  }

  function handleBlockSelect(block: TimeBlock) {
    if (!state.activeDate) return;
    update({
      selectedDates: [...state.selectedDates, { dateStr: state.activeDate, timeBlock: block }],
      activeDate:    null,
      activeDateAvail: null,
    });
  }

  function goStep3() {
    if (state.selectedDates.length < required) return;
    update({ step: 3, submitError: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.frequency || state.selectedDates.length === 0 || state.bedrooms === null || state.bathrooms === null) return;
    update({ submitting: true, submitError: "" });
    const selectedDates = state.selectedDates;
    try {
      const results: ConfirmedSlot[] = [];
      for (const { dateStr, timeBlock } of selectedDates) {
        const res = await fetch("/api/bookings", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cleanerId,
            customerName:    state.customerName.trim(),
            customerPhone:   state.customerPhone.trim(),
            customerAddress: fullAddress || state.customerAddress.trim(),
            hasPets:         state.hasPets,
            hasChildren:     state.hasChildren,
            hasCarpet:       state.hasCarpet,
            bedrooms:        state.bedrooms,
            bathrooms:       state.bathrooms,
            serviceType:     state.serviceType,
            frequency:       state.frequency,
            date:            dateStr,
            timeBlock,
          }),
        });
        if (res.status === 409) {
          update({
            submitting:    false,
            step:          2,
            selectedDates: selectedDates.filter((d) => d.dateStr !== dateStr),
            blockError:    `${formatDate(dateStr)} was just taken. Pick another date.`,
          });
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Booking failed");
        results.push(data as ConfirmedSlot);
      }
      update({ submitting: false, step: 4, confirmedBookings: results });
    } catch (err) {
      update({ submitting: false, submitError: (err as Error).message });
    }
  }

  async function handleMessenger() {
    if (!state.confirmedBookings.length || !cleaner?.messengerUsername) return;
    await navigator.clipboard.writeText(buildSmsBody(state.confirmedBookings, state));
    update({ messengerCopied: true });
    setTimeout(() => update({ messengerCopied: false }), 5000);
    window.open(`https://m.me/${cleaner.messengerUsername}`, "_blank");
  }

  // ─── Sub-components ──────────────────────────────────────────────────────

  function SizeBtn({
    selected, label, icon, onClick,
  }: { selected: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 text-sm font-bold transition-colors ${
          selected
            ? "border-sky-500 bg-sky-500 text-white"
            : "border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-500"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

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

      <main className={`mx-auto px-4 sm:px-6 py-8 sm:py-12 ${state.step === 3 ? "max-w-4xl" : "max-w-xl"}`}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">
          Book Your Cleaning
        </h1>
        <p className="text-slate-500 text-center mb-6 sm:mb-10 text-sm">
          With {cleaner.name} · Ready in under 60 seconds.
        </p>

        {/* Step indicator */}
        {state.step < 4 && (
          <div className="flex items-center gap-0 mb-6 sm:mb-10">
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

        {/* ── Step 0: House Details ── */}
        {state.step === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-6">
              {/* Bedrooms */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Bedrooms</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SizeBtn
                      key={n}
                      label={n === 5 ? "5+" : String(n)}
                      selected={state.bedrooms === n}
                      icon={<BedIcon />}
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
                      label={n === 5 ? "5+" : String(n)}
                      selected={state.bathrooms === n}
                      icon={<BathIcon />}
                      onClick={() => update({ bathrooms: n })}
                    />
                  ))}
                </div>
              </div>

              {/* Service Type */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-700 mb-3">Service Type</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {SERVICE_OPTIONS.map((opt) => {
                    const svcPrice = calcPrice(cleaner, state.bedrooms, state.bathrooms, null, opt.value);
                    const addonAmt =
                      opt.value === "deep" ? cleaner.serviceAddons?.deep :
                      opt.value === "move" ? cleaner.serviceAddons?.move : null;
                    const isSelected = state.serviceType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update({ serviceType: opt.value })}
                        className={`border-2 rounded-xl p-3 transition-colors flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50"
                            : "border-slate-200 bg-white hover:border-sky-300"
                        }`}
                      >
                        <div className={`shrink-0 ${isSelected ? "text-sky-500" : "text-slate-400"}`}>
                          {SERVICE_ICONS[opt.value]}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="font-bold text-slate-800 text-xs leading-tight">{opt.label}</p>
                            {addonAmt != null && addonAmt > 0 && (
                              <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-1 py-0.5 rounded-full leading-none">
                                +${addonAmt}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.description}</p>
                        </div>
                        {svcPrice !== null && (
                          <p className="text-base sm:text-lg font-extrabold text-sky-600 ml-auto sm:ml-0 sm:mt-auto sm:w-full sm:text-center shrink-0">
                            ${svcPrice.toFixed(2)}
                          </p>
                        )}
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
            <div className="grid grid-cols-2 gap-3">
              {FREQ_OPTIONS.map((opt) => {
                const optPrice = calcPrice(cleaner, state.bedrooms, state.bathrooms, opt.value, state.serviceType);
                const disc     = discountLabel(cleaner, opt.value);
                const isSelected = state.frequency === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ frequency: opt.value })}
                    className={`text-left border-2 rounded-2xl p-4 transition-colors flex flex-col gap-1 ${
                      isSelected
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-sky-300"
                    }`}
                  >
                    <p className="font-bold text-slate-800 text-base">{opt.label}</p>
                    <p className="text-xs text-slate-400 leading-tight">{opt.description}</p>
                    {optPrice !== null && (
                      <p className="text-2xl font-extrabold text-sky-600 mt-2">
                        ${optPrice.toFixed(2)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">per session</p>
                    {disc && (
                      <span className="self-start text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                        {disc}
                      </span>
                    )}
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

        {/* ── Step 2: Date & Time (week-view) ── */}
        {state.step === 2 && (
          <div className="space-y-6">
            {state.blockError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {state.blockError}
              </div>
            )}

            <p className="text-center text-sm font-semibold text-sky-600">
              Dates selected: {state.selectedDates.length} of {required}
            </p>

            {/* Week-view calendar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => update({ weekOffset: Math.max(0, state.weekOffset - 1) })}
                  disabled={state.weekOffset === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                >
                  ‹
                </button>
                <span className="text-sm font-bold text-slate-700">
                  {getWeekLabel(state.weekOffset)}
                </span>
                <button
                  type="button"
                  onClick={() => update({ weekOffset: Math.min(8, state.weekOffset + 1) })}
                  disabled={state.weekOffset >= 8}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                >
                  ›
                </button>
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d) => {
                  const isConfirmed = state.selectedDates.some((s) => s.dateStr === d.dateStr);
                  const isActive    = state.activeDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      disabled={d.isOff}
                      onClick={() => !d.isOff && handleDateClick(d.dateStr)}
                      className={`relative flex flex-col items-center rounded-xl py-2 sm:py-2.5 px-0.5 sm:px-1 transition-colors ${
                        d.isOff
                          ? "cursor-not-allowed opacity-30"
                          : isConfirmed
                          ? "bg-sky-500 text-white"
                          : isActive
                          ? "bg-sky-50 border-2 border-sky-500"
                          : "hover:bg-slate-50 border border-slate-100"
                      }`}
                    >
                      <span className={`text-[10px] font-semibold mb-1 ${
                        isConfirmed ? "text-sky-100" : isActive ? "text-sky-600" : "text-slate-400"
                      }`}>
                        {d.isToday ? "Today" : d.dayName}
                      </span>
                      <span className={`text-base font-extrabold leading-none ${
                        isConfirmed ? "text-white" : isActive ? "text-sky-600" : "text-slate-800"
                      }`}>
                        {state.activeDateLoading && isActive ? (
                          <span className="animate-pulse text-sm">…</span>
                        ) : (
                          d.dayNum
                        )}
                      </span>
                      {isConfirmed && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-sky-500 text-[9px] font-bold border border-sky-200 shadow-sm">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Morning / Afternoon toggles */}
            {state.activeDate && !state.activeDateLoading && state.activeDateAvail && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Pick a time for {formatDateShort(state.activeDate)}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(["morning", "afternoon"] as TimeBlock[]).map((block) => {
                    const avail = state.activeDateAvail![block];
                    const info  = BLOCK_INFO[block];
                    return (
                      <button
                        key={block}
                        type="button"
                        disabled={!avail}
                        onClick={() => avail && handleBlockSelect(block)}
                        className={`group border-2 rounded-2xl px-4 py-5 flex items-center gap-3 transition-colors text-left ${
                          !avail
                            ? "border-slate-100 bg-slate-50 cursor-not-allowed"
                            : "border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-500 active:bg-sky-600 active:border-sky-600"
                        }`}
                      >
                        <div>
                          <p className={`font-bold text-sm transition-colors ${avail ? "text-slate-800 group-hover:text-white" : "text-slate-300"}`}>
                            {info.label}
                          </p>
                          <p className={`text-xs mt-0.5 transition-colors ${avail ? "text-slate-500 group-hover:text-white/80" : "text-slate-300"}`}>
                            Start at {info.start}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No availability message */}
            {state.activeDate && !state.activeDateLoading && state.activeDateAvail &&
              !state.activeDateAvail.morning && !state.activeDateAvail.afternoon && (
              <p className="text-center text-slate-400 text-sm py-2">
                No availability on this date. Please try another day.
              </p>
            )}

            {/* Last confirmed selection feedback */}
            {state.selectedDates.length > 0 && (
              <p className="text-center text-sm text-slate-600 bg-white rounded-xl border border-slate-100 px-4 py-3">
                <span className="font-semibold text-sky-600">Selected: </span>
                {state.selectedDates.map(({ dateStr, timeBlock }, i) => (
                  <span key={dateStr}>
                    {formatDateShort(dateStr)}, {BLOCK_INFO[timeBlock].label}
                    {i < state.selectedDates.length - 1 ? " · " : ""}
                  </span>
                ))}
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
                disabled={state.selectedDates.length < required}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact Info + Booking Summary (2 columns) ── */}
        {state.step === 3 && (
          <form onSubmit={handleSubmit}>
            {state.submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
                {state.submitError}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* ── Left column: form fields ── */}
              <div className="flex-1 space-y-5">
                {/* Contact Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        id="fullName"
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
                      <PhoneField
                        required
                        value={state.customerPhone}
                        onChange={(v) => update({ customerPhone: v })}
                        placeholder="(512) 555-0100"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Address Details</h3>
                  <div>
                    <label htmlFor="homeAddress" className="block text-sm font-semibold text-slate-700 mb-1">Home Address</label>
                    <input
                      id="homeAddress"
                      type="text"
                      required
                      value={state.customerAddress}
                      onChange={(e) => update({ customerAddress: e.target.value })}
                      placeholder="123 Main St"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                      <input
                        id="city"
                        type="text"
                        required
                        value={state.customerCity}
                        onChange={(e) => update({ customerCity: e.target.value })}
                        placeholder="Austin"
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                      <input
                        id="state"
                        type="text"
                        required
                        value={state.customerState}
                        onChange={(e) => update({ customerState: e.target.value })}
                        placeholder="TX"
                        maxLength={2}
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-semibold text-slate-700 mb-1">ZIP Code</label>
                      <input
                        id="zipCode"
                        type="text"
                        required
                        value={state.customerZip}
                        onChange={(e) => update({ customerZip: e.target.value })}
                        placeholder="78701"
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Special Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={state.specialInstructions}
                      onChange={(e) => update({ specialInstructions: e.target.value })}
                      placeholder="Gate code, parking instructions, pets to watch out for…"
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    />
                  </div>
                </div>

                {/* Household Profile */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">Household Profile</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => update({ hasPets: !state.hasPets })}
                      className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all ${
                        state.hasPets
                          ? "border-sky-500 bg-sky-50 text-sky-600"
                          : "border-slate-200 bg-white text-slate-300 hover:border-sky-200"
                      }`}
                    >
                      <svg className="w-7 h-7 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="4.5" cy="9.5" r="2" />
                        <circle cx="9"   cy="4.5" r="2" />
                        <circle cx="15"  cy="4.5" r="2" />
                        <circle cx="19.5" cy="9.5" r="2" />
                        <path d="M12 12c-3 0-6 2-6 5.5 0 2 1.5 2.5 3 2.5h6c1.5 0 3-.5 3-2.5 0-3.5-3-5.5-6-5.5z" />
                      </svg>
                      <span className="text-xs font-semibold">Pets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ hasChildren: !state.hasChildren })}
                      className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all ${
                        state.hasChildren
                          ? "border-sky-500 bg-sky-50 text-sky-600"
                          : "border-slate-200 bg-white text-slate-300 hover:border-sky-200"
                      }`}
                    >
                      <svg className="w-7 h-7 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="6" r="3" />
                        <path d="M9 20v-5H7l2-5h6l2 5h-2v5" />
                      </svg>
                      <span className="text-xs font-semibold">Children</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ hasCarpet: !state.hasCarpet })}
                      className={`flex flex-col items-center py-4 rounded-xl border-2 transition-all ${
                        state.hasCarpet
                          ? "border-sky-500 bg-sky-50 text-sky-600"
                          : "border-slate-200 bg-white text-slate-300 hover:border-sky-200"
                      }`}
                    >
                      <svg className="w-7 h-7 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="6" width="18" height="12" rx="1" />
                        <line x1="3"  y1="10" x2="21" y2="10" />
                        <line x1="3"  y1="14" x2="21" y2="14" />
                        <line x1="8"  y1="6"  x2="8"  y2="18" />
                        <line x1="16" y1="6"  x2="16" y2="18" />
                      </svg>
                      <span className="text-xs font-semibold">Carpets</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Right column: Booking Summary ── */}
              <div className="w-full lg:w-72 lg:sticky lg:top-6 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-0">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Booking Summary</h3>

                  <div className="divide-y divide-slate-100">
                    {[
                      ["Service", SERVICE_LABELS[state.serviceType]],
                      [
                        "Date",
                        state.selectedDates.length === 1
                          ? `${formatDateShort(state.selectedDates[0].dateStr)}, ${BLOCK_INFO[state.selectedDates[0].timeBlock].label}`
                          : `${state.selectedDates.length} dates selected`,
                      ],
                      [
                        "Frequency",
                        FREQ_OPTIONS.find((f) => f.value === state.frequency)?.label ?? "",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-2.5 text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[55%]">{value}</span>
                      </div>
                    ))}

                    {price !== null && (
                      <div className="flex justify-between items-baseline pt-3 pb-1">
                        <span className="text-sm text-slate-500">Total Price</span>
                        <span className="text-2xl font-extrabold text-sky-600">${price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      disabled={state.submitting}
                      className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                    >
                      {state.submitting ? "Confirming…" : "Confirm →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ step: 2 })}
                      className="w-full border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:border-slate-300 transition-colors text-sm"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── Step 4: Confirmed ── */}
        {state.step === 4 && state.confirmedBookings.length > 0 && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center">
              <div className="w-14 h-14 bg-white border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-green-500">
                ✓
              </div>
              <p className="font-extrabold text-green-800 text-2xl">
                {state.confirmedBookings.length === 1
                  ? "Booking Confirmed!"
                  : `${state.confirmedBookings.length} Bookings Confirmed!`}
              </p>
              <p className="text-xs text-green-600 mt-2">
                ID: {state.confirmedBookings[0].id}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 divide-y divide-slate-100">
              {[
                ["Service",   SERVICE_LABELS[state.serviceType]],
                [
                  "Home",
                  `${state.bedrooms === 5 ? "5+" : state.bedrooms} bed · ${
                    state.bathrooms === 5 ? "5+" : state.bathrooms
                  } bath`,
                ],
                [
                  "Frequency",
                  FREQ_OPTIONS.find((f) => f.value === state.frequency)?.label ?? "",
                ],
                ["Address",  state.customerAddress],
                ["Phone",    state.customerPhone],
                ["Pets",     state.hasPets     ? "Yes" : "No"],
                ["Children", state.hasChildren ? "Yes" : "No"],
                ["Carpet",   state.hasCarpet   ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
              <div className="py-2.5 text-sm">
                <span className="text-slate-500 block mb-2">Date</span>
                {state.confirmedBookings.map((b) => (
                  <div key={b.id} className="flex justify-between items-baseline py-0.5">
                    <span className="text-slate-700">
                      {formatDateShort(b.date)} · {BLOCK_INFO[b.timeBlock].label}
                    </span>
                    <span className="text-slate-400 text-xs">({BLOCK_INFO[b.timeBlock].start})</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline py-2.5 text-sm">
                <span className="text-slate-500">Price per cleaning session</span>
                <span className="font-extrabold text-sky-600 text-base">
                  ${state.confirmedBookings[0]?.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ── 3 action buttons in a row ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {cleaner.messengerUsername ? (
                <div className="flex-1 space-y-2">
                  <button
                    type="button"
                    onClick={handleMessenger}
                    className="w-full font-bold py-4 rounded-2xl transition-colors text-sm bg-[#1877F2] hover:bg-[#1464d8] text-white flex items-center justify-center gap-2"
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

              {cleaner.phone ? (
                <a
                  href={`sms:${cleaner.phone}?body=${encodeURIComponent(buildSmsBody(state.confirmedBookings, state))}`}
                  className="flex-1 font-bold py-4 rounded-2xl transition-colors text-sm bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-2"
                >
                  Send via Text Message (SMS)
                </a>
              ) : null}

              <Link
                href="/"
                className="flex-1 font-bold py-4 rounded-2xl transition-colors text-sm border-2 border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 flex items-center justify-center"
              >
                Return to Home
              </Link>
            </div>

            {!cleaner.phone && !cleaner.messengerUsername && (
              <p className="text-center text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                Contact your cleaner directly to confirm the booking details.
              </p>
            )}

            <button
              onClick={() => setState(INITIAL)}
              className="w-full border-2 border-slate-200 text-slate-500 font-semibold py-3 rounded-xl hover:border-sky-300 hover:text-sky-600 transition-colors text-sm"
            >
              Book Another Cleaning
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
