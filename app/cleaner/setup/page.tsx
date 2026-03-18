"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, BadgeDollarSign, Phone, Link2, Clock, ChevronDown, type LucideIcon } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { isVipEmail } from "@/lib/vip";
import type { Cleaner, DayOfWeek, BlockedSlot, BlockedPeriod, ProviderTimeConfig, CleaningServiceType, RoomType } from "@/types";
import PhoneField from "@/components/PhoneField";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday",    label: "Segunda-feira" },
  { key: "tuesday",   label: "Terça-feira"   },
  { key: "wednesday", label: "Quarta-feira"  },
  { key: "thursday",  label: "Quinta-feira"  },
  { key: "friday",    label: "Sexta-feira"   },
  { key: "saturday",  label: "Sábado"        },
  { key: "sunday",    label: "Domingo"       },
];

type TabId = "agenda" | "precos" | "tempos" | "contato" | "link";

const TABS: { id: TabId; label: string; icon: LucideIcon; color: string }[] = [
  { id: "agenda",  label: "Agenda",  icon: CalendarDays,    color: "text-sky-500"     },
  { id: "precos",  label: "Preços",  icon: BadgeDollarSign, color: "text-emerald-500" },
  { id: "tempos",  label: "Tempos",  icon: Clock,           color: "text-sky-500"     },
  { id: "contato", label: "Contato", icon: Phone,           color: "text-violet-500"  },
  { id: "link",    label: "Link",    icon: Link2,           color: "text-orange-500"  },
];

// ─── Time config constants ─────────────────────────────────────────────────

const SERVICE_TYPES: { value: CleaningServiceType; label: string }[] = [
  { value: "regular", label: "Regular"          },
  { value: "deep",    label: "Deep Cleaning"    },
  { value: "move",    label: "Move-in/Move-out" },
];


function calcBase(formula: Cleaner["pricingFormula"], beds: number, baths: number): number {
  return formula.base + (beds - 1) * formula.extraPerBedroom + (baths - 1) * formula.extraPerBathroom;
}

export default function CleanerSetupPage() {
  const router = useRouter();
  const [activeTab,       setActiveTab]       = useState<TabId>("agenda");
  const [cleanerId,       setCleanerId]       = useState<string | null>(null);
  const [token,           setToken]           = useState<string | null>(null);
  const [cleaner,         setCleaner]         = useState<Cleaner | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState("");
  const [copied,          setCopied]          = useState(false);
  const [apiError,        setApiError]        = useState("");
  const [draftPrices,     setDraftPrices]     = useState<Record<string, string>>({});
  const [draftDiscounts,  setDraftDiscounts]  = useState<Record<string, string>>({});
  const [newBlockedDate,   setNewBlockedDate]   = useState("");
  const [newBlockedPeriod, setNewBlockedPeriod] = useState<BlockedPeriod>("ALL_DAY");
  const [slug,            setSlug]            = useState("");
  const [slugSaving,      setSlugSaving]      = useState(false);
  const [openDayDropdown, setOpenDayDropdown] = useState<DayOfWeek | null>(null);

  // Time configs state
  const [timeConfigsLoaded, setTimeConfigsLoaded] = useState(false);
  const [timeConfigsSaving, setTimeConfigsSaving] = useState(false);
  const [activeTimeService, setActiveTimeService] = useState<CleaningServiceType>("regular");
  const [draftStaffCounts, setDraftStaffCounts]   = useState<{ regular: number; deep: number; move: number }>({ regular: 1, deep: 1, move: 1 });

  type TimeFormRow = { baseDuration: string; bedroom: string; bathroom: string; kitchen: string; living_room: string };
  type DraftTimeConfigs = Record<CleaningServiceType, TimeFormRow>;

  const DEFAULT_DRAFT: DraftTimeConfigs = {
    regular: { baseDuration: "120", bedroom: "30", bathroom: "20", kitchen: "15", living_room: "15" },
    deep:    { baseDuration: "180", bedroom: "40", bathroom: "25", kitchen: "20", living_room: "20" },
    move:    { baseDuration: "240", bedroom: "45", bathroom: "30", kitchen: "25", living_room: "25" },
  };

  const [draftTimeConfigs, setDraftTimeConfigs] = useState<DraftTimeConfigs>(DEFAULT_DRAFT);

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

        const cleanerRes = await fetch(`/api/cleaners/${session.user.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = (await cleanerRes.json()) as Cleaner & { error?: string };

        if (cancelled) return;

        if (data?.id) {
          if (
            !isVipEmail(session.user.email ?? "") && (
              data.subscriptionStatus === "past_due" ||
              data.subscriptionStatus === "canceled" ||
              data.subscriptionStatus === "inactive"
            )
          ) {
            router.replace("/cleaner/subscription");
            return;
          }
          setCleaner(data);
          setSlug(data.slug ?? "");
          if (data.defaultStaffCount) {
            setDraftStaffCounts(data.defaultStaffCount);
          }

          // Load time configs (non-blocking — table may not exist yet)
          try {
            const tcRes = await fetch(`/api/cleaners/${session.user.id}/time-configs`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (tcRes.ok) {
              const tcData = await tcRes.json() as { configs: ProviderTimeConfig[] };
              const configs = tcData.configs ?? [];
              if (configs.length > 0) {
                setDraftTimeConfigs((prev) => {
                  const next = { ...prev };
                  for (const cfg of configs) {
                    next[cfg.serviceType] = {
                      ...next[cfg.serviceType],
                      baseDuration: String(cfg.baseDuration),
                      [cfg.roomType]: String(cfg.timePerRoom),
                    };
                  }
                  return next;
                });
              }
            }
          } catch {
            // Table not yet migrated — silently ignore
          } finally {
            setTimeConfigsLoaded(true);
          }
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

  useEffect(() => {
    if (!openDayDropdown) return;
    function handleClick() { setOpenDayDropdown(null); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openDayDropdown]);

  function toggleDay(day: DayOfWeek) {
    if (!cleaner) return;
    const current = cleaner.availability[day];
    const isActive = current.morning || current.afternoon;
    setCleaner({
      ...cleaner,
      availability: {
        ...cleaner.availability,
        [day]: isActive
          ? { ...current, morning: false, afternoon: false }
          : { ...current, morning: true, afternoon: true,
              startTime: current.startTime ?? "09:00" },
      },
    });
  }

  function setDayTime(day: DayOfWeek, field: "startTime" | "endTime", time: string) {
    if (!cleaner) return;
    setCleaner({
      ...cleaner,
      availability: {
        ...cleaner.availability,
        [day]: { ...cleaner.availability[day], [field]: time },
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

  const PERIOD_LABELS: Record<BlockedPeriod, string> = {
    ALL_DAY:   "Dia Inteiro",
    MORNING:   "Manhã",
    AFTERNOON: "Tarde",
  };

  function addBlockedDate() {
    if (!cleaner || !newBlockedDate) return;
    const slots = (cleaner.blockedDates ?? []) as BlockedSlot[];
    // Avoid exact duplicate
    if (slots.some((s) => s.date === newBlockedDate && s.period === newBlockedPeriod)) return;
    // If adding ALL_DAY, remove any existing MORNING/AFTERNOON for this date
    let newSlots: BlockedSlot[];
    if (newBlockedPeriod === "ALL_DAY") {
      newSlots = [
        ...slots.filter((s) => s.date !== newBlockedDate),
        { date: newBlockedDate, period: "ALL_DAY" },
      ];
    } else {
      // Remove ALL_DAY for this date if it exists, then add specific period
      newSlots = [
        ...slots.filter((s) => !(s.date === newBlockedDate && s.period === "ALL_DAY")),
        { date: newBlockedDate, period: newBlockedPeriod },
      ];
    }
    newSlots.sort((a, b) => a.date.localeCompare(b.date));
    setCleaner({ ...cleaner, blockedDates: newSlots });
    setNewBlockedDate("");
  }

  function removeBlockedDate(date: string, period: BlockedPeriod) {
    if (!cleaner) return;
    const slots = (cleaner.blockedDates ?? []) as BlockedSlot[];
    setCleaner({ ...cleaner, blockedDates: slots.filter((s) => !(s.date === date && s.period === period)) });
  }

  function formatBlockedDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  function updateDiscount(field: "weekly" | "biweekly" | "monthly", value: string) {
    if (!cleaner) return;
    setDraftDiscounts((d) => ({ ...d, [field]: value }));
    const num = parseFloat(value);
    setCleaner({
      ...cleaner,
      frequencyDiscounts: { ...cleaner.frequencyDiscounts, [field]: isNaN(num) ? 0 : num },
    });
  }

  function updateDraftTime(svc: CleaningServiceType, field: string, value: string) {
    setDraftTimeConfigs((prev) => ({
      ...prev,
      [svc]: { ...prev[svc], [field]: value },
    }));
  }

  function calcTimePreview(svc: CleaningServiceType, beds: number, baths: number, staff: number): string {
    const d = draftTimeConfigs[svc];
    const base     = parseInt(d.baseDuration, 10) || 0;
    const perBed   = parseInt(d.bedroom,      10) || 0;
    const perBath  = parseInt(d.bathroom,     10) || 0;
    const raw      = base + beds * perBed + baths * perBath;
    const total    = Math.ceil(raw / Math.max(1, staff));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 && m > 0 ? `${h}h${m}` : h > 0 ? `${h}h` : `${m}min`;
  }

  async function saveTimeConfigs() {
    if (!cleanerId || !token) return;
    setTimeConfigsSaving(true);
    try {
      const ROOM_KEYS: RoomType[] = ["bedroom", "bathroom", "kitchen", "living_room"];
      const configs = (["regular", "deep", "move"] as CleaningServiceType[]).flatMap((svc) => {
        const d    = draftTimeConfigs[svc];
        const base = parseInt(d.baseDuration, 10) || 0;
        return ROOM_KEYS.map((room) => ({
          serviceType:  svc,
          baseDuration: base,
          roomType:     room,
          timePerRoom:  parseInt(d[room], 10) || 0,
        }));
      });

      // Save time configs and default staff count in parallel
      const [tcRes, scRes] = await Promise.all([
        fetch(`/api/cleaners/${cleanerId}/time-configs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ configs }),
        }),
        fetch(`/api/cleaners/${cleanerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ defaultStaffCount: draftStaffCounts }),
        }),
      ]);

      if (!tcRes.ok) {
        const err = await tcRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      if (!scRes.ok) {
        const err = await scRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      // Update local cleaner state with new defaultStaffCount
      setCleaner((prev) => prev ? { ...prev, defaultStaffCount: draftStaffCounts } : prev);
      showToast("Configurações de tempo salvas!");
    } catch (err) {
      showToast("Erro ao salvar. Tente novamente.");
      console.error("[saveTimeConfigs]", err);
    } finally {
      setTimeConfigsSaving(false);
    }
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

  async function saveSlug() {
    if (!cleanerId || !token) return;
    setSlugSaving(true);
    try {
      const res = await fetch(`/api/cleaners/${cleanerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: slug || null }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error ?? "Save failed");
      }
      showToast("Slug salvo com sucesso!");
    } catch (err) {
      showToast("Erro ao salvar slug. Tente novamente.");
      console.error("[saveSlug]", err);
    } finally {
      setSlugSaving(false);
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

  async function copyLink() {
    if (!slug) return;
    const link = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(link);
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
            <Link href="/cleaner/agenda" className="text-sm text-slate-500 hover:text-sky-600 font-medium transition-colors">
              Agenda
            </Link>
            <span className="text-sm text-slate-400 hidden sm:block">{cleaner.name}</span>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1 text-sm">Olá, {cleaner.name}. Gerencie sua agenda, preços e canais de contato.</p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[calc(33%-4px)] sm:min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? "text-white" : tab.color} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Agenda ─────────────────────────────────────────────────────── */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            {/* Rotina Semanal */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Rotina Semanal</h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS.map(({ key, label }) => {
                  const day = cleaner.availability[key];
                  const isActive = day.morning || day.afternoon;
                  const startVal = day.startTime ?? "08:00";

                  // Generate options every 30 min from 06:00 to 20:00 in 24h format
                  const timeOptions: string[] = [];
                  for (let h = 6; h <= 20; h++) {
                    for (const m of ["00", "30"]) {
                      timeOptions.push(`${String(h).padStart(2, "0")}:${m}`);
                    }
                  }

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-4 space-y-3 transition-colors ${
                        isActive ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      {/* Day name + toggle */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-base ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                          {label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDay(key)}
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                            isActive ? "bg-blue-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Start time dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!isActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDayDropdown(openDayDropdown === key ? null : key);
                          }}
                          className={`w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors ${
                            isActive
                              ? "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                              : "border-slate-100 bg-slate-100/60 cursor-not-allowed"
                          }`}
                        >
                          <Clock size={15} className={isActive ? "text-slate-400 shrink-0" : "text-slate-300 shrink-0"} />
                          <span className={`text-xs shrink-0 ${isActive ? "text-slate-500" : "text-slate-300"}`}>Início:</span>
                          <span className={`flex-1 text-left text-sm font-medium ${isActive ? "text-slate-700" : "text-slate-400"}`}>
                            {startVal}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`shrink-0 transition-transform ${isActive ? "text-slate-400" : "text-slate-300"} ${openDayDropdown === key ? "rotate-180" : ""}`}
                          />
                        </button>
                        {openDayDropdown === key && (
                          <div
                            className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {timeOptions.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setDayTime(key, "startTime", opt);
                                  setOpenDayDropdown(null);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  startVal === opt
                                    ? "bg-sky-50 text-sky-600 font-semibold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </section>

            {/* Folgas Específicas */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Folgas Específicas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bloqueie datas pontuais sem alterar sua rotina semanal. Ex: consulta médica, feriado, viagem.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                {/* Period selector pills */}
                <div className="flex gap-2">
                  {(["ALL_DAY", "MORNING", "AFTERNOON"] as BlockedPeriod[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewBlockedPeriod(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                        newBlockedPeriod === p
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                      }`}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
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
                    {(cleaner.blockedDates as BlockedSlot[]).map((s) => (
                      <li key={`${s.date}-${s.period}`} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                        <div className="space-y-0.5">
                          <span className="text-sm text-slate-700 font-medium capitalize">{formatBlockedDate(s.date)}</span>
                          <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                            s.period === "ALL_DAY"
                              ? "bg-slate-200 text-slate-600"
                              : s.period === "MORNING"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-violet-100 text-violet-700"
                          }`}>
                            {PERIOD_LABELS[s.period]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(s.date, s.period)}
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              {saving ? "Salvando…" : "Salvar Agenda"}
            </button>
          </div>
        )}

        {/* ── Tab: Preços ──────────────────────────────────────────────────────── */}
        {activeTab === "precos" && (
          <div className="space-y-6">
            {/* Precificação */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Precificação</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Definindo os valores abaixo, calculamos automaticamente o preço para qualquer tamanho de casa.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-6">
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
                    <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                      <div className="px-3 py-2 font-bold text-slate-500">Casa</div>
                      <div className="px-3 py-2 font-bold text-slate-600 text-center">Regular</div>
                      <div className="px-3 py-2 font-bold text-sky-600 text-center">Deep</div>
                      <div className="px-3 py-2 font-bold text-violet-600 text-center">Move-in/out</div>
                    </div>
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

            {/* Descontos por Frequência */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Descontos por Frequência</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Desconto em % oferecido para clientes com agendamentos recorrentes.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 grid grid-cols-3 gap-3 sm:gap-6">
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
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={draftDiscounts[field] ?? String(cleaner.frequencyDiscounts[field])}
                        onChange={(e) => updateDiscount(field, e.target.value)}
                        onFocus={(e) => { setDraftDiscounts((d) => ({ ...d, [field]: String(cleaner.frequencyDiscounts[field]) })); e.target.select(); }}
                        className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                      />
                      <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-l border-slate-200 py-2 select-none">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              {saving ? "Salvando…" : "Salvar Preços"}
            </button>
          </div>
        )}

        {/* ── Tab: Tempos ──────────────────────────────────────────────────────── */}
        {activeTab === "tempos" && (
          <div className="space-y-6">
            {!timeConfigsLoaded && (
              <p className="text-xs text-slate-400 italic animate-pulse px-1">Carregando configurações…</p>
            )}

            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Duração dos Serviços</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Defina o tempo base e o tempo adicional por cômodo. O sistema gera os horários disponíveis automaticamente.
                </p>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                {/* Service type pills */}
                <div className="flex gap-2">
                  {SERVICE_TYPES.map((svc) => (
                    <button
                      key={svc.value}
                      type="button"
                      onClick={() => setActiveTimeService(svc.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                        activeTimeService === svc.value
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      {svc.label}
                    </button>
                  ))}
                </div>

                {/* Formula description */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fórmula de Tempo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tempo = Tempo Base + Quartos × min/Quarto + Banheiros × min/Banheiro + …
                    </p>
                  </div>

                  {/* Base duration */}
                  <div className="flex items-center gap-4">
                    <label className="flex-1 text-sm font-semibold text-slate-700">
                      Tempo Base (casa 1/1)
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 w-[120px] shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="120"
                        value={draftTimeConfigs[activeTimeService].baseDuration}
                        onChange={(e) => updateDraftTime(activeTimeService, "baseDuration", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                      />
                      <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-l border-slate-200 py-2 select-none">min</span>
                    </div>
                  </div>

                  {/* Per-room extras */}
                  {([
                    { field: "bedroom"     as RoomType, label: "Quarto adicional",   color: "text-slate-700" },
                    { field: "bathroom"    as RoomType, label: "Banheiro adicional",  color: "text-slate-700" },
                    { field: "kitchen"     as RoomType, label: "Cozinha",             color: "text-slate-500" },
                    { field: "living_room" as RoomType, label: "Sala de estar",       color: "text-slate-500" },
                  ]).map(({ field, label, color }) => (
                    <div key={field} className="flex items-center gap-4">
                      <label className={`flex-1 text-sm font-semibold ${color}`}>{label}</label>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 w-[120px] shrink-0">
                        <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-2 select-none">+</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={draftTimeConfigs[activeTimeService][field]}
                          onChange={(e) => updateDraftTime(activeTimeService, field, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                        />
                        <span className="px-2.5 text-slate-400 text-sm bg-slate-50 border-l border-slate-200 py-2 select-none">min</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live preview table */}
                <div className="pt-1 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2 mb-3">
                    Pré-visualização — {SERVICE_TYPES.find((s) => s.value === activeTimeService)?.label}
                  </p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                    <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                      <div className="px-3 py-2 font-bold text-slate-500">Casa</div>
                      <div className="px-3 py-2 font-bold text-slate-600 text-center">1 func.</div>
                      <div className="px-3 py-2 font-bold text-amber-600 text-center">2 func.</div>
                      <div className="px-3 py-2 font-bold text-emerald-600 text-center">3 func.</div>
                    </div>
                    {previewRows.map(({ beds, baths }, i) => (
                      <div
                        key={`${beds}-${baths}`}
                        className={`grid grid-cols-4 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                      >
                        <div className="px-3 py-2.5 text-slate-500">
                          {beds} {beds > 1 ? "qtos" : "qto"} · {baths} {baths > 1 ? "bnhs" : "bnh"}
                        </div>
                        <div className="px-3 py-2.5 font-semibold text-slate-800 text-center">{calcTimePreview(activeTimeService, beds, baths, 1)}</div>
                        <div className="px-3 py-2.5 font-semibold text-amber-600 text-center">{calcTimePreview(activeTimeService, beds, baths, 2)}</div>
                        <div className="px-3 py-2.5 font-semibold text-emerald-600 text-center">{calcTimePreview(activeTimeService, beds, baths, 3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Default staff count per service */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Equipe Padrão por Serviço</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quantas funcionárias vão para cada tipo de serviço? Isso define o tempo de duração e libera os horários corretos.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                {SERVICE_TYPES.map((svc) => (
                  <div key={svc.value} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-700 w-32 shrink-0">{svc.label}</span>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setDraftStaffCounts((prev) => ({ ...prev, [svc.value]: n }))}
                          className={`w-12 py-2 rounded-xl text-sm font-bold transition-colors border ${
                            draftStaffCounts[svc.value] === n
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                          }`}
                        >
                          {n}×
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {calcTimePreview(svc.value, 2, 1, draftStaffCounts[svc.value])} p/ casa 2/1
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={saveTimeConfigs}
              disabled={timeConfigsSaving}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              {timeConfigsSaving ? "Salvando…" : "Salvar Durações"}
            </button>
          </div>
        )}

        {/* ── Tab: Contato ─────────────────────────────────────────────────────── */}
        {activeTab === "contato" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-sky-100 bg-sky-50">
                <h2 className="font-bold text-slate-800 text-lg">Canais de Contato</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Os clientes usarão estes canais para enviar os detalhes do agendamento. Preencha pelo menos um.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Telefone (SMS / WhatsApp)
                  </label>
                  <PhoneField
                    value={cleaner.phone ?? ""}
                    onChange={(v) => setCleaner({ ...cleaner, phone: v })}
                    placeholder="(512) 555-0100"
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              {saving ? "Salvando…" : "Salvar Contato"}
            </button>
          </div>
        )}

        {/* ── Tab: Link ────────────────────────────────────────────────────────── */}
        {activeTab === "link" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-lg">Seu Link de Agendamento</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escolha um endereço personalizado para compartilhar com seus clientes.
                </p>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1.5 sm:hidden break-all">
                    {typeof window !== "undefined" ? window.location.origin : ""}/
                  </p>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400">
                    <span className="hidden sm:flex px-3 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-3.5 items-center select-none whitespace-nowrap">
                      {typeof window !== "undefined" ? window.location.origin : ""}/
                    </span>
                    <input
                      type="text"
                      placeholder="ex: ana-limpezas"
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      className="flex-1 min-w-0 px-4 py-3.5 text-sm text-slate-800 bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveSlug}
                  disabled={slugSaving}
                  className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
                >
                  {slugSaving ? "Salvando…" : "Salvar Link Personalizado"}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  disabled={!slug}
                  className={`w-full font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    copied
                      ? "bg-green-500 text-white"
                      : "border-2 border-slate-200 text-slate-600 hover:border-sky-300 active:bg-slate-50"
                  }`}
                >
                  {copied ? "✓ Link copiado!" : "Copiar Link"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
