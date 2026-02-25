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

const BEDS        = [1, 2, 3, 4, 5];
const BATHS       = [1, 2, 3, 4, 5];
const BED_LABELS  = ["1 bed", "2 beds", "3 beds", "4 beds", "5+ beds"];
const BATH_LABELS = ["1 bath", "2 baths", "3 baths", "4 baths", "5+ baths"];

export default function CleanerSetupPage() {
  const router = useRouter();
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [cleaner,   setCleaner]   = useState<Cleaner | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState("");
  const [copied,    setCopied]    = useState(false);
  const [apiError,  setApiError]  = useState("");

  // ── Auth guard → fetch profile ───────────────────────────────────────────────
  // Both steps run sequentially in a single effect so the fetch never fires
  // before we've confirmed there is an active session.
  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/cleaner/login");
        return;
      }

      const id          = session.user.id;
      const accessToken = session.access_token;
      setCleanerId(id);
      setToken(accessToken);

      fetch(`/api/cleaners/${id}`)
        .then((r) => r.json())
        .then((data: Cleaner & { error?: string }) => {
          if (data && data.id) {
            setCleaner(data);
          } else {
            setApiError(data?.error || "Unknown error from API.");
          }
          setLoading(false);
        })
        .catch((err) => {
          setApiError(String(err));
          setLoading(false);
        });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Empty deps: intentionally runs only once on mount.

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

  function updatePrice(beds: number, baths: number, value: string) {
    if (!cleaner) return;
    const num = parseFloat(value);
    setCleaner({
      ...cleaner,
      pricingTable: { ...cleaner.pricingTable, [`${beds}-${baths}`]: isNaN(num) ? 0 : num },
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
          availability:       cleaner.availability,
          pricingTable:       cleaner.pricingTable,
          frequencyDiscounts: cleaner.frequencyDiscounts,
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
            Run the SQL schema in the Supabase SQL Editor, then reload this page.
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

        {/* ── Weekly Schedule ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Weekly Schedule</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Morning = 9:00am–1:00pm &nbsp;|&nbsp; Afternoon = 1:30pm–6:00pm
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
                    <span className={`text-sm ${day.morning ? "text-slate-700" : "text-slate-400"}`}>
                      Morning
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={day.afternoon}
                      onChange={() => toggleBlock(key, "afternoon")}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className={`text-sm ${day.afternoon ? "text-slate-700" : "text-slate-400"}`}>
                      Afternoon
                    </span>
                  </label>
                  {!day.morning && !day.afternoon && (
                    <span className="text-xs text-slate-400 italic ml-auto">Day off</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pricing Table ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg">Pricing Table</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set your flat rate ($) for each bedroom × bathroom combination.
            </p>
          </div>
          <div className="overflow-x-auto px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4" />
                  {BATH_LABELS.map((b) => (
                    <th key={b} className="text-center text-slate-500 font-semibold pb-3 px-2 min-w-[72px]">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {BEDS.map((beds, bi) => (
                  <tr key={beds}>
                    <td className="text-slate-600 font-semibold py-2.5 pr-4 whitespace-nowrap">
                      {BED_LABELS[bi]}
                    </td>
                    {BATHS.map((baths) => (
                      <td key={baths} className="py-2.5 px-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                          <span className="px-2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={cleaner.pricingTable[`${beds}-${baths}`] ?? ""}
                            onChange={(e) => updatePrice(beds, baths, e.target.value)}
                            className="w-16 py-1.5 pr-2 text-sm text-slate-800 bg-white focus:outline-none"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
