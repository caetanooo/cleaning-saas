"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import type { Booking, Cleaner, TimeBlock } from "@/types";

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
  morning:   { label: "Manhã",  hours: "9h–13h"       },
  afternoon: { label: "Tarde",  hours: "13h30–18h"    },
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

  // Modal
  const [modalDate,   setModalDate]   = useState<string | null>(null);
  const [cancelling,  setCancelling]  = useState<string | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);

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
          fetch(`/api/cleaners/${session.user.id}`),
          fetch(`/api/bookings?cleanerId=${session.user.id}`),
        ]);
        if (cancelled) return;

        const cleanerData = await cleanerRes.json();
        const bookingsData = await bookingsRes.json();

        if (cleanerData?.id) setCleaner(cleanerData as Cleaner);
        else setApiError(cleanerData?.error ?? "Erro ao carregar perfil.");

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

  // Days grid: null = empty cell before day 1
  const calendarCells = useMemo<(number | null)[]>(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  // Index confirmed bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (b.status !== "confirmed") continue;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings]);

  function isBlocked(ds: string)     { return (cleaner?.blockedDates ?? []).includes(ds); }
  function isPast(day: number)       { return new Date(viewYear, viewMonth, day) < todayDate; }
  function isToday(day: number)      {
    return viewYear === todayDate.getFullYear() &&
           viewMonth === todayDate.getMonth()   &&
           day === todayDate.getDate();
  }

  // ── Modal derived state ───────────────────────────────────────────────────────

  const modalBookings  = modalDate ? (bookingsByDate[modalDate] ?? []) : [];
  const modalIsBlocked = modalDate ? isBlocked(modalDate)              : false;
  const modalIsPast    = modalDate
    ? new Date(...(modalDate.split("-").map(Number) as [number, number, number])) < todayDate
    : false;

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function cancelBooking(bookingId: string) {
    if (!token) return;
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao cancelar");
      }
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" as const } : b),
      );
      showToast("Agendamento cancelado. Dia liberado!");
      setModalDate(null);
    } catch (err) {
      showToast(String(err));
    } finally {
      setCancelling(null);
    }
  }

  async function toggleBlock(ds: string) {
    if (!cleaner || !cleanerId || !token) return;
    setBlockSaving(true);
    const blocked    = cleaner.blockedDates ?? [];
    const newBlocked = blocked.includes(ds)
      ? blocked.filter((d) => d !== ds)
      : [...blocked, ds].sort();
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
      setCleaner({ ...cleaner, blockedDates: newBlocked });
      showToast(blocked.includes(ds) ? "Dia desbloqueado!" : "Dia bloqueado!");
      setModalDate(null);
    } catch (err) {
      showToast(String(err));
    } finally {
      setBlockSaving(false);
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
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Minha Agenda</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Veja seus agendamentos confirmados. Clique em qualquer dia para ver detalhes ou bloquear.
          </p>
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

              const ds          = toDateStr(viewYear, viewMonth, day);
              const dayBookings = bookingsByDate[ds] ?? [];
              const blocked     = isBlocked(ds);
              const past        = isPast(day);
              const today_      = isToday(day);
              const hasMorning  = dayBookings.some((b) => b.timeBlock === "morning");
              const hasAfternoon= dayBookings.some((b) => b.timeBlock === "afternoon");

              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => setModalDate(ds)}
                  className={`aspect-square flex flex-col items-center justify-start pt-2 px-1 border-t border-slate-50 transition-colors relative
                    ${today_       ? "bg-sky-50"                        : ""}
                    ${blocked && !dayBookings.length ? "bg-slate-100"  : ""}
                    ${past         ? "opacity-50"                       : "hover:bg-slate-50 cursor-pointer"}
                  `}
                >
                  {/* Day number */}
                  <span className={`text-xs font-bold leading-none
                    ${today_              ? "bg-sky-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]" : ""}
                    ${!today_ && blocked && !dayBookings.length ? "text-slate-400" : ""}
                    ${!today_ && !blocked && dayBookings.length ? "text-slate-800" : ""}
                    ${!today_ && !blocked && !dayBookings.length ? "text-slate-600" : ""}
                  `}>
                    {day}
                  </span>

                  {/* Booking indicators */}
                  <div className="flex gap-0.5 mt-1">
                    {hasMorning   && <span className="w-1.5 h-1.5 rounded-full bg-sky-500"    />}
                    {hasAfternoon && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                  </div>

                  {/* Block indicator */}
                  {blocked && !dayBookings.length && (
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
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
              Dia bloqueado
            </span>
          </div>
        </div>

        {/* ── Upcoming bookings list ── */}
        {(() => {
          const todayStr = toDateStr(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
          const upcoming = bookings
            .filter((b) => b.status === "confirmed" && b.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date) || a.timeBlock.localeCompare(b.timeBlock));
          if (!upcoming.length) return null;
          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Próximos agendamentos</h2>
              </div>
              <ul className="divide-y divide-slate-50">
                {upcoming.map((b) => (
                  <li key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-800 capitalize">
                        {formatDateLong(b.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {BLOCK_INFO[b.timeBlock].label} ({BLOCK_INFO[b.timeBlock].hours}) ·{" "}
                        {b.customerName}
                      </p>
                      <p className="text-xs text-slate-400">{b.customerAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalDate(b.date)}
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

      {/* ── Modal ── */}
      {modalDate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalDate(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 capitalize text-sm">
                {formatDateLong(modalDate)}
              </h3>
              <button
                onClick={() => setModalDate(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Confirmed bookings for this day */}
              {modalBookings.length > 0 && (
                <div className="space-y-4">
                  {modalBookings.map((b) => (
                    <div key={b.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Time block header */}
                      <div className={`px-4 py-2.5 flex items-center gap-2 ${
                        b.timeBlock === "morning" ? "bg-sky-50 border-b border-sky-100" : "bg-violet-50 border-b border-violet-100"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          b.timeBlock === "morning" ? "bg-sky-500" : "bg-violet-500"
                        }`} />
                        <span className={`text-sm font-bold ${
                          b.timeBlock === "morning" ? "text-sky-700" : "text-violet-700"
                        }`}>
                          {BLOCK_INFO[b.timeBlock].label} — {BLOCK_INFO[b.timeBlock].hours}
                        </span>
                      </div>

                      {/* Booking details */}
                      <div className="px-4 py-4 space-y-2.5 text-sm">
                        {[
                          ["Tipo de serviço", b.serviceType ? SERVICE_LABELS[b.serviceType] : "Regular"],
                          ["Frequência",      FREQ_LABELS[b.frequency] ?? b.frequency],
                          ["Casa",            `${b.bedrooms} qto${b.bedrooms > 1 ? "s" : ""} · ${b.bathrooms} bnh${b.bathrooms > 1 ? "s" : ""}`],
                          ["Pets",            b.hasPets ? "Sim" : "Não"],
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
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Telefone</span>
                            <a
                              href={`tel:${b.customerPhone}`}
                              className="font-semibold text-sky-600 hover:underline"
                            >
                              {b.customerPhone}
                            </a>
                          </div>
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
                        </div>
                      </div>

                      {/* Cancel button */}
                      <div className="px-4 pb-4">
                        <button
                          type="button"
                          disabled={cancelling === b.id}
                          onClick={() => cancelBooking(b.id)}
                          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                        >
                          {cancelling === b.id ? "Cancelando…" : "Cancelar e Liberar Agenda"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No bookings for this day */}
              {modalBookings.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-2">
                  {modalIsBlocked ? "Este dia está bloqueado." : "Nenhum agendamento neste dia."}
                </p>
              )}

              {/* Block / unblock toggle (only for future days) */}
              {!modalIsPast && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={blockSaving}
                    onClick={() => toggleBlock(modalDate)}
                    className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 ${
                      modalIsBlocked
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {blockSaving
                      ? "Salvando…"
                      : modalIsBlocked
                      ? "Desbloquear este dia"
                      : "Bloquear este dia"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
