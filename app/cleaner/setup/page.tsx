"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import type { Cleaner, DayOfWeek } from "@/types";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday",    label: "Monday" },
  { key: "tuesday",   label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday",  label: "Thursday" },
  { key: "friday",    label: "Friday" },
  { key: "saturday",  label: "Saturday" },
  { key: "sunday",    label: "Sunday" },
];

function calcBase(formula: Cleaner["pricingFormula"], beds: number, baths: number): number {
  return formula.base + (beds - 1) * formula.extraPerBedroom + (baths - 1) * formula.extraPerBathroom;
}

export default function CleanerSetupPage() {
  const router = useRouter();
  const [cleanerId,   setCleanerId]   = useState<string | null>(null);
  const [token,       setToken]       = useState<string | null>(null);
  const [cleaner,     setCleaner]     = useState<Cleaner | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const [apiError,    setApiError]    = useState("");
  // Raw string drafts so inputs can be empty while the user is editing
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [newDayOff,   setNewDayOff]   = useState("");

  // ── Auth guard → fetch profile ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setApiError("Loading timed out. Please refresh the page.");
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
          setApiError(data?.error ?? "Could not load profile. Check Supabase tables.");
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

  function addDayOff() {
    if (!cleaner || !newDayOff) return;
    if ((cleaner.daysOff ?? []).includes(newDayOff)) return;
    setCleaner({ ...cleaner, daysOff: [...(cleaner.daysOff ?? []), newDayOff].sort() });
    setNewDayOff("");
  }

  function removeDayOff(date: string) {
    if (!cleaner) return;
    setCleaner({ ...cleaner, daysOff: (cleaner.daysOff ?? []).filter((d) => d !== date) });
  }

  function formatDayOff(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
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
          daysOff:            cleaner.daysOff ?? [],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Saved successfully!");
    } catch {
      showToast("Error saving. Please try again.");
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
        <p className="text-slate-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-lg w-full space-y-4">
          <p className="font-bold text-slate-800 text-lg">Could not load your profile</p>
          {apiError && (
            <pre className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-red-700 overflow-auto whitespace-pre-wrap break-all">
              {apiError}
            </pre>
          )}
          <p className="text-sm text-slate-500">
            Make sure the <strong>cleaners</strong> table has been created in your Supabase project.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Live preview rows
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
              Log out
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
          <h1 className="text-3xl font-extrabold text-slate-900">Availability & Pricing</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Hi, {cleaner.name}. Configure your schedule and rates below.
          </p>
        </div>

        {/* ── Contact Channels ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sky-100 bg-sky-50">
            <h2 className="font-bold text-slate-800 text-lg">Contact Channels</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clients will use these to send you their booking details. Fill in at least one.
            </p>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Phone Number (SMS / WhatsApp)
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
                Facebook Messenger Username{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Found at facebook.com/your.username. Example: <span className="font-mono">janedoe.cleaner</span>
              </p>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                <span className="px-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-3 select-none">
                  m.me/
                </span>
                <input
                  type="text"
                  placeholder="janedoe.cleaner"
                  value={cleaner.messengerUsername ?? ""}
                  onChange={(e) => setCleaner({ ...cleaner, messengerUsername: e.target.value })}
                  className="flex-1 px-3 py-3 text-sm text-slate-800 bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Weekly Schedule ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Weekly Schedule</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Morning starts at 9:00 AM &nbsp;|&nbsp; Afternoon starts at 2:00 PM
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {DAYS.map(({ key, label }) => {
              const day = cleaner.availability[key];
              return (
                <div key={key} className="px-6 py-4 flex items-center gap-6">
                  <span className="w-28 text-sm font-semibold text-slate-700">{label}</span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.morning}
                      onChange={() => toggleBlock(key, "morning")}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className={`text-sm ${day.morning ? "text-slate-700" : "text-slate-400"}`}>Morning</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.afternoon}
                      onChange={() => toggleBlock(key, "afternoon")}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className={`text-sm ${day.afternoon ? "text-slate-700" : "text-slate-400"}`}>Afternoon</span>
                  </label>
                  {!day.morning && !day.afternoon && (
                    <span className="text-xs text-slate-400 italic ml-auto">Day off</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Specific Days Off ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Specific Days Off</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Block individual dates without changing your weekly routine.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex gap-3">
              <input
                type="date"
                value={newDayOff}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewDayOff(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
              />
              <button
                type="button"
                disabled={!newDayOff}
                onClick={addDayOff}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
              >
                Add
              </button>
            </div>
            {(cleaner.daysOff ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific days off added yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {(cleaner.daysOff ?? []).map((d) => (
                  <li key={d} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-slate-700 font-medium">{formatDayOff(d)}</span>
                    <button
                      type="button"
                      onClick={() => removeDayOff(d)}
                      className="text-slate-400 hover:text-red-500 transition-colors text-sm font-semibold ml-4 shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Pricing</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              We&apos;ll calculate your full pricing table automatically based on these rates.
            </p>
          </div>
          <div className="px-6 py-5 space-y-6">

            {/* Base formula */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Base Formula</p>
              {([
                { field: "base"             as const, label: "Base Price (1 bed / 1 bath)",  prefix: "$",  placeholder: "90"  },
                { field: "extraPerBedroom"  as const, label: "Additional Bedroom",            prefix: "+$", placeholder: "20"  },
                { field: "extraPerBathroom" as const, label: "Additional Bathroom",           prefix: "+$", placeholder: "15"  },
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

            {/* Service add-ons */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">Service Add-ons</p>
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

            {/* Live comparative preview */}
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 mb-3">
                Price Preview
              </p>
              <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                {/* Header */}
                <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                  <div className="px-3 py-2 font-bold text-slate-500">House</div>
                  <div className="px-3 py-2 font-bold text-slate-600 text-center">Regular</div>
                  <div className="px-3 py-2 font-bold text-sky-600 text-center">Deep</div>
                  <div className="px-3 py-2 font-bold text-violet-600 text-center">Move-in/out</div>
                </div>
                {/* Rows */}
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
                        {beds} bed{beds > 1 ? "s" : ""} · {baths} bath{baths > 1 ? "s" : ""}
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

        {/* ── Frequency Discounts ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Frequency Discounts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Percentage off for repeat bookings.</p>
          </div>
          <div className="px-6 py-5 grid grid-cols-3 gap-6">
            {(
              [
                { field: "weekly",   label: "Weekly" },
                { field: "biweekly", label: "Bi-weekly" },
                { field: "monthly",  label: "Monthly" },
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

        {/* ── Booking Link ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Your Booking Link</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share this link with your customers.</p>
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
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </main>
    </div>
  );
}
