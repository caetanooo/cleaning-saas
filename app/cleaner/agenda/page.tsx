"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import { isVipEmail } from "@/lib/vip";
import type { Booking, Cleaner, TimeBlock, BlockedSlot, BlockedPeriod, CleaningServiceType, FrequencyType } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FREQ_LABELS: Record<string, string> = {
  one_time: "Avulso",
  weekly:   "Semanal",
  biweekly: "Quinzenal",
  monthly:  "Mensal",
};

const SERVICE_LABELS: Record<string, string> = {
  regular: "Regular",
  deep:    "Deep Cleaning",
  move:    "Move-in / Move-out",
};

const BLOCK_INFO: Record<TimeBlock, { label: string; hours: string }> = {
  morning:   { label: "Manhã",  hours: "9h–13h"    },
  afternoon: { label: "Tarde",  hours: "13h30–18h" },
};

const PERIOD_LABELS: Record<BlockedPeriod, string> = {
  ALL_DAY:   "Dia Inteiro",
  MORNING:   "Manhã",
  AFTERNOON: "Tarde",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Returns the precise time range if available, otherwise the legacy block label. */
function formatBookingTime(b: Booking): string {
  if (b.scheduledStartAt && b.scheduledEndAt) {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${fmt(b.scheduledStartAt)} – ${fmt(b.scheduledEndAt)}`;
  }
  return `${BLOCK_INFO[b.timeBlock].label} (${BLOCK_INFO[b.timeBlock].hours})`;
}

/** Returns which periods are blocked for a given date */
function getDayBlockedPeriods(
  blockedDates: BlockedSlot[],
  ds: string,
): { morning: boolean; afternoon: boolean } {
  const morning = blockedDates.some(
    (s) => s.date === ds && (s.period === "ALL_DAY" || s.period === "MORNING"),
  );
  const afternoon = blockedDates.some(
    (s) => s.date === ds && (s.period === "ALL_DAY" || s.period === "AFTERNOON"),
  );
  return { morning, afternoon };
}

// ─── Manual Booking Form State ─────────────────────────────────────────────────

interface ManualBookingForm {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  timeBlock: TimeBlock;
  bedrooms: number;
  bathrooms: number;
  serviceType: CleaningServiceType;
  frequency: FrequencyType;
  totalPrice: string;
}

const EMPTY_MANUAL_FORM: ManualBookingForm = {
  customerName:    "",
  customerPhone:   "",
  customerAddress: "",
  date:            "",
  timeBlock:       "morning",
  bedrooms:        2,
  bathrooms:       1,
  serviceType:     "regular",
  frequency:       "one_time",
  totalPrice:      "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CleanerAgendaPage() {
  const router = useRouter();

  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [cleaner,   setCleaner]   = useState<Cleaner | null>(null);
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState("");
  const [toast,     setToast]     = useState("");

  // Calendar month
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewYear,  setViewYear]  = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  // Day modal
  const [modalDate,       setModalDate]       = useState<string | null>(null);
  const [focusedBookingId, setFocusedBookingId] = useState<string | null>(null);
  const [cancelling,      setCancelling]      = useState<string | null>(null);
  const [completing,      setCompleting]      = useState<string | null>(null);
  const [blockSaving,     setBlockSaving]     = useState(false);
  const [blockPeriod,     setBlockPeriod]     = useState<BlockedPeriod>("ALL_DAY");

  function openDayModal(date: string, focusId?: string) {
    setModalDate(date);
    setFocusedBookingId(focusId ?? null);
  }
  function closeDayModal() {
    setModalDate(null);
    setFocusedBookingId(null);
  }

  // Manual booking modal
  const [manualOpen,   setManualOpen]   = useState(false);
  const [manualForm,   setManualForm]   = useState<ManualBookingForm>(EMPTY_MANUAL_FORM);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError,  setManualError]  = useState("");

  // Completed bookings animation (id → true while animating)
  const [justCompleted, setJustCompleted] = useState<Record<string, boolean>>({});

  // Customize panel state
  const [customizingId,   setCustomizingId]   = useState<string | null>(null);
  const [savingDetails,   setSavingDetails]   = useState<string | null>(null);

  interface BookingDraft {
    serviceType: CleaningServiceType;
    frequency: FrequencyType;
    bedrooms: number;
    bathrooms: number;
    hasPets: boolean;
    hasChildren: boolean;
    hasCarpet: boolean;
    staffCount: number;
    totalPrice: string;
  }
  const [draftDetails, setDraftDetails] = useState<Record<string, BookingDraft>>({});

  // ── Auth + data load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) { setApiError("Tempo de carregamento esgotado."); setLoading(false); }
    }, 10_000);

    async function init() {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) { router.replace("/cleaner/login"); return; }

        setCleanerId(session.user.id);
        setToken(session.access_token);

        const [cleanerRes, bookingsRes] = await Promise.all([
          fetch(`/api/cleaners/${session.user.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/bookings?cleanerId=${session.user.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);
        if (cancelled) return;

        const cleanerData = await cleanerRes.json();
        const bookingsData = await bookingsRes.json();

        if (cleanerData?.id) {
          const profile = cleanerData as Cleaner;
          if (
            !isVipEmail(session.user.email ?? "") && (
              profile.subscriptionStatus === "past_due" ||
              profile.subscriptionStatus === "canceled" ||
              profile.subscriptionStatus === "inactive"
            )
          ) {
            router.replace("/cleaner/subscription");
            return;
          }
          setCleaner(profile);
        } else setApiError(cleanerData?.error ?? "Erro ao carregar perfil.");

        if (Array.isArray(bookingsData)) setBookings(bookingsData as Booking[]);
      } catch (err) {
        if (!cancelled) setApiError(String(err));
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived calendar data ─────────────────────────────────────────────────────

  const calendarCells = useMemo<(number | null)[]>(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  // Index confirmed/completed bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings]);

  const blockedDates = useMemo<BlockedSlot[]>(
    () => (cleaner?.blockedDates ?? []) as BlockedSlot[],
    [cleaner],
  );

  function isPast(day: number) { return new Date(viewYear, viewMonth, day) < todayDate; }
  function isToday(day: number) {
    return viewYear === todayDate.getFullYear() &&
           viewMonth === todayDate.getMonth()   &&
           day === todayDate.getDate();
  }

  // ── Modal derived state ───────────────────────────────────────────────────────

  const allModalBookings = (modalDate ? (bookingsByDate[modalDate] ?? []) : [])
    .slice()
    .sort((a, b) => {
      const blockOrder = (b: Booking) => b.timeBlock === "morning" ? 0 : 1;
      const blockCmp = blockOrder(a) - blockOrder(b);
      if (blockCmp !== 0) return blockCmp;
      if (a.scheduledStartAt && b.scheduledStartAt)
        return a.scheduledStartAt.localeCompare(b.scheduledStartAt);
      return 0;
    });
  const modalBookings    = focusedBookingId
    ? allModalBookings.filter((b) => b.id === focusedBookingId)
    : allModalBookings;
  const modalBlocks    = modalDate ? getDayBlockedPeriods(blockedDates, modalDate) : { morning: false, afternoon: false };
  const modalIsPast    = modalDate
    ? new Date(...(modalDate.split("-").map(Number) as [number, number, number])) < todayDate
    : false;

  // Slots for this day that are blocked but we could add a block for
  const currentDaySlots = modalDate
    ? blockedDates.filter((s) => s.date === modalDate)
    : [];

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function cancelBooking(bookingId: string) {
    if (!token) return;
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao cancelar");
      }
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" as const } : b),
      );
      setCustomizingId(null);
      showToast("Agendamento cancelado. Dia liberado!");
      closeDayModal();
    } catch (err) {
      showToast(String(err));
    } finally {
      setCancelling(null);
    }
  }

  async function completeBooking(bookingId: string) {
    if (!token) return;
    setCompleting(bookingId);
    setJustCompleted((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao concluir");
      }
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "completed" as const } : b),
      );
      showToast("Faxina concluída!");
    } catch (err) {
      setJustCompleted((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
      showToast(String(err));
    } finally {
      setCompleting(null);
    }
  }

  async function reopenBooking(bookingId: string) {
    if (!token) return;
    setCompleting(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reopen" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao reabrir");
      }
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "confirmed" as const } : b),
      );
      setJustCompleted((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
      showToast("Agendamento reaberto!");
    } catch (err) {
      showToast(String(err));
    } finally {
      setCompleting(null);
    }
  }

  async function saveDetails(bookingId: string) {
    if (!token) return;
    const draft = draftDetails[bookingId];
    if (!draft) return;
    setSavingDetails(bookingId);
    try {
      const priceNum = parseFloat(draft.totalPrice);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action:      "update_details",
          serviceType: draft.serviceType,
          frequency:   draft.frequency,
          bedrooms:    draft.bedrooms,
          bathrooms:   draft.bathrooms,
          hasPets:     draft.hasPets,
          hasChildren: draft.hasChildren,
          hasCarpet:   draft.hasCarpet,
          staffCount:  draft.staffCount,
          ...(isNaN(priceNum) ? {} : { totalPrice: priceNum }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao salvar");
      }
      const result = await res.json() as {
        serviceType: CleaningServiceType; frequency: FrequencyType;
        bedrooms: number; bathrooms: number;
        hasPets: boolean; hasChildren: boolean; hasCarpet: boolean;
        staffCount: number; totalPrice: number; estimatedDuration: number | null;
      };
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, ...result }
            : b,
        ),
      );
      setCustomizingId(null);
      showToast("Agendamento atualizado!");
    } catch (err) {
      showToast(String(err));
    } finally {
      setSavingDetails(null);
    }
  }

  async function addBlock(ds: string, period: BlockedPeriod) {
    if (!cleaner || !cleanerId || !token) return;
    // Avoid duplicate
    const already = blockedDates.some((s) => s.date === ds && s.period === period);
    if (already) return;

    // If adding ALL_DAY, remove any existing MORNING/AFTERNOON for this date
    let newBlocked: BlockedSlot[];
    if (period === "ALL_DAY") {
      newBlocked = [
        ...blockedDates.filter((s) => s.date !== ds),
        { date: ds, period: "ALL_DAY" },
      ];
    } else {
      // Remove ALL_DAY if it exists, add the specific period
      newBlocked = [
        ...blockedDates.filter((s) => !(s.date === ds && s.period === "ALL_DAY")),
        { date: ds, period },
      ];
    }
    newBlocked.sort((a, b) => a.date.localeCompare(b.date));
    await saveBlockedDates(newBlocked, "Bloqueio adicionado!");
  }

  async function removeBlock(ds: string, period: BlockedPeriod) {
    if (!cleaner || !cleanerId || !token) return;
    const newBlocked = blockedDates.filter((s) => !(s.date === ds && s.period === period));
    await saveBlockedDates(newBlocked, "Bloqueio removido!");
  }

  async function saveBlockedDates(newBlocked: BlockedSlot[], successMsg: string) {
    setBlockSaving(true);
    try {
      const res = await fetch(`/api/cleaners/${cleanerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...cleaner, blockedDates: newBlocked }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao salvar");
      }
      setCleaner({ ...cleaner!, blockedDates: newBlocked });
      showToast(successMsg);
    } catch (err) {
      showToast(String(err));
    } finally {
      setBlockSaving(false);
    }
  }

  async function submitManualBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanerId || !token) return;
    setManualError("");
    const price = parseFloat(manualForm.totalPrice);
    if (!manualForm.customerName.trim() || !manualForm.date || isNaN(price) || price < 0) {
      setManualError("Preencha nome do cliente, data e valor.");
      return;
    }
    setManualSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          cleanerId,
          customerName:    manualForm.customerName,
          customerPhone:   manualForm.customerPhone || "—",
          customerAddress: manualForm.customerAddress || "—",
          hasPets:         false,
          hasChildren:     false,
          hasCarpet:       false,
          bedrooms:        manualForm.bedrooms,
          bathrooms:       manualForm.bathrooms,
          serviceType:     manualForm.serviceType,
          frequency:       manualForm.frequency,
          date:            manualForm.date,
          timeBlock:       manualForm.timeBlock,
          source:          "manual",
          totalPrice:      price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar agendamento");

      // Re-fetch bookings to include the new manual one
      const bookingsRes = await fetch(`/api/bookings?cleanerId=${cleanerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsData = await bookingsRes.json();
      if (Array.isArray(bookingsData)) setBookings(bookingsData as Booking[]);

      setManualOpen(false);
      setManualForm(EMPTY_MANUAL_FORM);
      showToast("Agendamento manual adicionado!");
    } catch (err) {
      setManualError(String(err));
    } finally {
      setManualSaving(false);
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

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Carregando agenda…</p>
      </div>
    );
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-lg w-full space-y-4">
          <p className="font-bold text-slate-800 text-lg">Não foi possível carregar o perfil</p>
          {apiError && (
            <pre className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-red-700 overflow-auto">
              {apiError}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-sm"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-800">CleanClick</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/cleaner/setup" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
              Configurações
            </Link>
            <span className="text-sm font-bold text-sky-600">Agenda</span>
            <span className="text-sm text-slate-400 hidden sm:block">{cleaner.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Minha Agenda</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Veja seus agendamentos. Clique em um dia para detalhes ou bloqueios.
            </p>
          </div>
          {/* Feature 3: Add manual booking button */}
          <button
            type="button"
            onClick={() => { setManualForm(EMPTY_MANUAL_FORM); setManualError(""); setManualOpen(true); }}
            className="shrink-0 flex items-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Novo Agendamento</span>
          </button>
        </div>

        {/* ── Calendar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors font-bold text-lg"
            >
              ‹
            </button>
            <h2 className="font-bold text-slate-800 text-base">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors font-bold text-lg"
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-50">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-2 text-center text-xs font-bold text-slate-400">
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="aspect-square" />;

              const ds           = toDateStr(viewYear, viewMonth, day);
              const dayBookings  = bookingsByDate[ds] ?? [];
              const past         = isPast(day);
              const today_       = isToday(day);
              const dayBlocked   = getDayBlockedPeriods(blockedDates, ds);
              const morningActive   = dayBookings.filter((b) => b.timeBlock === "morning"   && b.status !== "completed");
              const afternoonActive = dayBookings.filter((b) => b.timeBlock === "afternoon" && b.status !== "completed");
              const completedList   = dayBookings.filter((b) => b.status === "completed");
              const hasMorning    = morningActive.length > 0;
              const hasAfternoon  = afternoonActive.length > 0;
              const fullyBlocked  = dayBlocked.morning && dayBlocked.afternoon;

              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => openDayModal(ds)}
                  className={`aspect-square flex flex-col items-center justify-start pt-2 px-1 border-t border-slate-50 transition-colors relative
                    ${today_       ? "bg-sky-50"                                    : ""}
                    ${fullyBlocked && !dayBookings.length ? "bg-slate-100"          : ""}
                    ${past         ? "opacity-50"                                   : "hover:bg-slate-50 cursor-pointer"}
                  `}
                >
                  {/* Day number */}
                  <span className={`text-xs font-bold leading-none
                    ${today_  ? "bg-sky-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]" : ""}
                    ${!today_ && fullyBlocked && !dayBookings.length ? "text-slate-400" : ""}
                    ${!today_ && !fullyBlocked && dayBookings.length ? "text-slate-800" : ""}
                    ${!today_ && !fullyBlocked && !dayBookings.length ? "text-slate-600" : ""}
                  `}>
                    {day}
                  </span>

                  {/* Booking + block indicators */}
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {morningActive.map((_, i) => <span key={`m${i}`} className="w-1.5 h-1.5 rounded-full bg-sky-500" />)}
                    {afternoonActive.map((_, i) => <span key={`a${i}`} className="w-1.5 h-1.5 rounded-full bg-violet-500" />)}
                    {completedList.map((_, i) => <span key={`c${i}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />)}
                    {!hasMorning   && dayBlocked.morning   && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"  />}
                    {!hasAfternoon && dayBlocked.afternoon && <span className="w-1.5 h-1.5 rounded-full bg-rose-400"   />}
                  </div>

                  {/* Full block label */}
                  {fullyBlocked && !dayBookings.length && (
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-none">bloq.</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              Manhã agendada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
              Tarde agendada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Concluída
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Manhã bloqueada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              Tarde bloqueada
            </span>
          </div>
        </div>

        {/* ── Upcoming bookings list ── */}
        {(() => {
          const todayStr = toDateStr(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
          const upcoming = bookings
            .filter((b) => b.status === "confirmed" && b.date >= todayStr)
            .sort((a, b) => {
              const dateCmp = a.date.localeCompare(b.date);
              if (dateCmp !== 0) return dateCmp;
              const blockCmp = (a.timeBlock === "morning" ? 0 : 1) - (b.timeBlock === "morning" ? 0 : 1);
              if (blockCmp !== 0) return blockCmp;
              if (a.scheduledStartAt && b.scheduledStartAt)
                return a.scheduledStartAt.localeCompare(b.scheduledStartAt);
              return 0;
            });
          if (!upcoming.length) return null;
          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Próximos agendamentos</h2>
              </div>
              <ul className="divide-y divide-slate-50">
                {upcoming.map((b) => (
                  <li key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 capitalize">
                          {formatDateLong(b.date)}
                        </p>
                        {b.source === "manual" && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                            Manual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatBookingTime(b)} · {b.customerName}
                      </p>
                      <p className="text-xs text-slate-400">{b.customerAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDayModal(b.date, b.id)}
                      className="text-xs text-sky-600 font-semibold hover:text-sky-700 shrink-0"
                    >
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </main>

      {/* ── Day Modal ── */}
      {modalDate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeDayModal()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 capitalize text-sm">
                {formatDateLong(modalDate)}
              </h3>
              <button
                onClick={closeDayModal}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Confirmed bookings for this day */}
              {modalBookings.length > 0 && (
                <div className="space-y-4">
                  {modalBookings.map((b) => {
                    const isCompleted = b.status === "completed";
                    const isAnimating = justCompleted[b.id];
                    return (
                      <div key={b.id} className={`border rounded-xl overflow-hidden transition-all duration-500 ${
                        isCompleted ? "border-emerald-200" : "border-slate-200"
                      }`}>
                        {/* Time block header — turns green when completed */}
                        <div className={`px-4 py-2.5 flex items-center gap-2 transition-colors duration-500 ${
                          isCompleted
                            ? "bg-emerald-50 border-b border-emerald-100"
                            : b.timeBlock === "morning"
                              ? "bg-sky-50 border-b border-sky-100"
                              : "bg-violet-50 border-b border-violet-100"
                        }`}>
                          <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                            isCompleted ? "bg-emerald-500" :
                            b.timeBlock === "morning" ? "bg-sky-500" : "bg-violet-500"
                          }`} />
                          <span className={`text-sm font-bold transition-colors duration-500 ${
                            isCompleted ? "text-emerald-700" :
                            b.timeBlock === "morning" ? "text-sky-700" : "text-violet-700"
                          }`}>
                            {formatBookingTime(b)}
                          </span>
                          {/* Source badge */}
                          {b.source === "manual" && (
                            <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                              Manual
                            </span>
                          )}
                          {/* Completed badge */}
                          {isCompleted && (
                            <span className={`ml-auto text-[10px] bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isAnimating ? "animate-bounce" : ""
                            }`}>
                              ✓ Concluída
                            </span>
                          )}
                        </div>

                        {/* Booking details */}
                        <div className="px-4 py-4 space-y-2.5 text-sm">
                          {[
                            ["Tipo de serviço", b.serviceType ? SERVICE_LABELS[b.serviceType] : "Regular"],
                            ["Frequência",      FREQ_LABELS[b.frequency] ?? b.frequency],
                            ["Casa",            `${b.bedrooms} qto${b.bedrooms > 1 ? "s" : ""} · ${b.bathrooms} bnh${b.bathrooms > 1 ? "s" : ""}`],
                            ["Pets",      b.hasPets                    ? "Sim" : "Não"],
                            ["Crianças",  (b.hasChildren ?? false)    ? "Sim" : "Não"],
                            ["Carpete",   (b.hasCarpet   ?? false)    ? "Sim" : "Não"],
                            ["Equipe",    `${b.staffCount ?? 1} pessoa${(b.staffCount ?? 1) > 1 ? "s" : ""}`],
                            ["Valor",           `$${b.totalPrice.toFixed(2)}`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4">
                              <span className="text-slate-400">{label}</span>
                              <span className="font-semibold text-slate-700 text-right">{value}</span>
                            </div>
                          ))}

                          {/* Customer */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Cliente</span>
                              <span className="font-semibold text-slate-700">{b.customerName}</span>
                            </div>
                            {b.customerPhone !== "—" && (
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Telefone</span>
                                <a
                                  href={`tel:${b.customerPhone}`}
                                  className="font-semibold text-sky-600 hover:underline"
                                >
                                  {b.customerPhone}
                                </a>
                              </div>
                            )}
                            {b.customerAddress !== "—" && (
                              <div className="flex justify-between gap-4 items-start">
                                <span className="text-slate-400 shrink-0">Endereço</span>
                                <a
                                  href={mapsUrl(b.customerAddress)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-sky-600 hover:underline text-right"
                                >
                                  {b.customerAddress} ↗
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Customise panel — full booking edit */}
                        {!isCompleted && customizingId === b.id && draftDetails[b.id] && (() => {
                          const draft = draftDetails[b.id];
                          const setDraft = (patch: Partial<BookingDraft>) =>
                            setDraftDetails((prev) => ({ ...prev, [b.id]: { ...prev[b.id], ...patch } }));
                          return (
                            <div className="mx-4 mb-3 border border-amber-200 bg-amber-50 rounded-xl px-4 py-4 space-y-4">
                              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Personalizar Agendamento</p>

                              {/* Service type */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo de serviço</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  {(["regular", "deep", "move"] as CleaningServiceType[]).map((st) => (
                                    <button key={st} type="button"
                                      onClick={() => setDraft({ serviceType: st })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                        draft.serviceType === st
                                          ? "bg-amber-500 text-white border-amber-500"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                      }`}
                                    >
                                      {SERVICE_LABELS[st]}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Frequency */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Frequência</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  {(["one_time", "monthly", "biweekly", "weekly"] as FrequencyType[]).map((fr) => (
                                    <button key={fr} type="button"
                                      onClick={() => setDraft({ frequency: fr })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                        draft.frequency === fr
                                          ? "bg-amber-500 text-white border-amber-500"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                      }`}
                                    >
                                      {FREQ_LABELS[fr]}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Bedrooms / Bathrooms */}
                              <div className="flex gap-6">
                                {(["bedrooms", "bathrooms"] as const).map((field) => (
                                  <div key={field} className="space-y-1.5">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                      {field === "bedrooms" ? "Quartos" : "Banheiros"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button type="button"
                                        onClick={() => setDraft({ [field]: Math.max(1, draft[field] - 1) })}
                                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-amber-300 transition-colors"
                                      >−</button>
                                      <span className="text-sm font-bold text-slate-800 w-4 text-center">{draft[field]}</span>
                                      <button type="button"
                                        onClick={() => setDraft({ [field]: Math.min(10, draft[field] + 1) })}
                                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-amber-300 transition-colors"
                                      >+</button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Extras (pets / children / carpet) */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Extras</span>
                                <div className="flex gap-3 flex-wrap">
                                  {([
                                    { key: "hasPets",      label: "Pets"     },
                                    { key: "hasChildren",  label: "Crianças" },
                                    { key: "hasCarpet",    label: "Carpete"  },
                                  ] as { key: keyof BookingDraft; label: string }[]).map(({ key, label }) => (
                                    <button key={key} type="button"
                                      onClick={() => setDraft({ [key]: !draft[key as "hasPets" | "hasChildren" | "hasCarpet"] })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                        draft[key as "hasPets" | "hasChildren" | "hasCarpet"]
                                          ? "bg-amber-500 text-white border-amber-500"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Team size */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipe</span>
                                <div className="flex gap-1.5">
                                  {([1, 2, 3] as const).map((n) => (
                                    <button key={n} type="button"
                                      onClick={() => setDraft({ staffCount: n })}
                                      className={`w-11 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                        draft.staffCount === n
                                          ? "bg-amber-500 text-white border-amber-500"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                                      }`}
                                    >
                                      {n}×
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Price */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor (R$)</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.totalPrice}
                                  onChange={(e) => setDraft({ totalPrice: e.target.value })}
                                  className="w-32 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 bg-white"
                                />
                                <p className="text-[10px] text-slate-400">Deixe em branco para recalcular automaticamente.</p>
                              </div>

                              {/* Save button */}
                              <button
                                type="button"
                                disabled={savingDetails === b.id}
                                onClick={() => saveDetails(b.id)}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                              >
                                {savingDetails === b.id ? "Salvando…" : "Salvar alterações"}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Reopen button — completed bookings only */}
                        {isCompleted && (
                          <div className="px-4 pb-4">
                            <button
                              type="button"
                              disabled={completing === b.id}
                              onClick={() => reopenBooking(b.id)}
                              className="w-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-500 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                            >
                              {completing === b.id ? "Reabrindo…" : "↩ Desfazer conclusão"}
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isCompleted && (
                          <div className="px-4 pb-4 flex gap-2">
                            {/* Customise toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                if (customizingId === b.id) {
                                  setCustomizingId(null);
                                } else {
                                  setCustomizingId(b.id);
                                  setDraftDetails((prev) => ({
                                    ...prev,
                                    [b.id]: prev[b.id] ?? {
                                      serviceType: (b.serviceType ?? "regular") as CleaningServiceType,
                                      frequency:   (b.frequency   ?? "one_time") as FrequencyType,
                                      bedrooms:    b.bedrooms  ?? 2,
                                      bathrooms:   b.bathrooms ?? 1,
                                      hasPets:     b.hasPets      ?? false,
                                      hasChildren: b.hasChildren  ?? false,
                                      hasCarpet:   b.hasCarpet    ?? false,
                                      staffCount:  b.staffCount   ?? 1,
                                      totalPrice:  b.totalPrice.toFixed(2),
                                    },
                                  }));
                                }
                              }}
                              className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                                customizingId === b.id
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                              }`}
                            >
                              ✎
                            </button>
                            {/* Complete + Cancel buttons — hidden while customizing */}
                            {customizingId !== b.id && (<>
                            <button
                              type="button"
                              disabled={completing === b.id}
                              onClick={() => completeBooking(b.id)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                              {completing === b.id ? (
                                <span className="animate-spin">⟳</span>
                              ) : (
                                <>✓ Limpeza concluída</>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={cancelling === b.id}
                              onClick={() => cancelBooking(b.id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                            >
                              {cancelling === b.id ? "Cancelando…" : "Limpeza cancelada"}
                            </button>
                            </>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No bookings for this day */}
              {modalBookings.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-2">
                  {(modalBlocks.morning && modalBlocks.afternoon)
                    ? "Este dia está totalmente bloqueado."
                    : modalBlocks.morning
                    ? "Manhã bloqueada."
                    : modalBlocks.afternoon
                    ? "Tarde bloqueada."
                    : "Nenhum agendamento neste dia."}
                </p>
              )}

              {/* Quick-schedule button — only for future/today days */}
              {!modalIsPast && (
                <button
                  type="button"
                  onClick={() => {
                    setManualForm({ ...EMPTY_MANUAL_FORM, date: modalDate });
                    setManualError("");
                    closeDayModal();
                    setManualOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 text-sky-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  Agendar cliente neste dia
                </button>
              )}

              {/* Feature 1: Block management (future days only) */}
              {!modalIsPast && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bloquear período</p>

                  {/* Period selector */}
                  <div className="flex gap-2">
                    {(["ALL_DAY", "MORNING", "AFTERNOON"] as BlockedPeriod[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBlockPeriod(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                          blockPeriod === p
                            ? "bg-sky-500 text-white border-sky-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                        }`}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={blockSaving}
                    onClick={() => addBlock(modalDate, blockPeriod)}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {blockSaving ? "Salvando…" : `Bloquear ${PERIOD_LABELS[blockPeriod]}`}
                  </button>

                  {/* Existing blocks for this day */}
                  {currentDaySlots.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400">Bloqueios ativos neste dia:</p>
                      {currentDaySlots.map((s) => (
                        <div key={s.period} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                          <span className="text-xs font-medium text-slate-600">{PERIOD_LABELS[s.period]}</span>
                          <button
                            type="button"
                            disabled={blockSaving}
                            onClick={() => removeBlock(s.date, s.period)}
                            className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Booking Modal (Feature 3) ── */}
      {manualOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setManualOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Novo Agendamento Manual</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cliente captado fora da plataforma</p>
              </div>
              <button
                onClick={() => setManualOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitManualBooking} className="px-6 py-5 space-y-4">
              {/* Customer name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do cliente *</label>
                <input
                  type="text"
                  required
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder="Ex: Ana Lima"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço completo</label>
                <input
                  type="text"
                  value={manualForm.customerAddress}
                  onChange={(e) => setManualForm((f) => ({ ...f, customerAddress: e.target.value }))}
                  placeholder="Rua das Flores, 123"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={manualForm.customerPhone}
                  onChange={(e) => setManualForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Date + Time block */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Turno</label>
                  <select
                    value={manualForm.timeBlock}
                    onChange={(e) => setManualForm((f) => ({ ...f, timeBlock: e.target.value as TimeBlock }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  >
                    <option value="morning">Manhã (9h–13h)</option>
                    <option value="afternoon">Tarde (13h30–18h)</option>
                  </select>
                </div>
              </div>

              {/* House size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quartos</label>
                  <select
                    value={manualForm.bedrooms}
                    onChange={(e) => setManualForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  >
                    {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} qto{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Banheiros</label>
                  <select
                    value={manualForm.bathrooms}
                    onChange={(e) => setManualForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  >
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} bnh{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>

              {/* Service type + frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de limpeza</label>
                  <select
                    value={manualForm.serviceType}
                    onChange={(e) => setManualForm((f) => ({ ...f, serviceType: e.target.value as CleaningServiceType }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  >
                    <option value="regular">Regular</option>
                    <option value="deep">Deep Cleaning</option>
                    <option value="move">Move-in/out</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Frequência</label>
                  <select
                    value={manualForm.frequency}
                    onChange={(e) => setManualForm((f) => ({ ...f, frequency: e.target.value as FrequencyType }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  >
                    <option value="one_time">Avulso</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (R$) *</label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                  <span className="px-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2.5 select-none">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={manualForm.totalPrice}
                    onChange={(e) => setManualForm((f) => ({ ...f, totalPrice: e.target.value }))}
                    placeholder="150.00"
                    className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none"
                  />
                </div>
              </div>

              {manualError && (
                <p className="text-sm text-red-600 font-medium">{manualError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setManualOpen(false)}
                  className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl text-sm hover:border-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {manualSaving ? "Salvando…" : "Adicionar à Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
