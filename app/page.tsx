import Link from "next/link";
import DemoTabs from "./DemoTabs";

const CHECKOUT_URL = "https://buy.stripe.com/eVqeV6cfsbOmgz72zR57W00";

// ─── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">✨</span>
      <span className="text-xl font-extrabold text-slate-900">CleanClick</span>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ─── Mockup components ────────────────────────────────────────────────────────

function BookingPreview() {
  return (
    <div className="flex-1 overflow-hidden px-3 pb-3 pt-1">
      <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 mb-3 gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
        <span className="text-[8px] text-slate-500 font-mono truncate">cleanclick.app/ana</span>
      </div>
      <div className="text-center mb-2.5">
        <p className="text-[11px] font-extrabold text-slate-800">Ana Santos</p>
        <p className="text-[8px] text-sky-500 font-semibold">Book your cleaning</p>
      </div>
      <div className="flex justify-center gap-1.5 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-sky-500" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Bedrooms</p>
      <div className="flex gap-1 mb-2.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`flex-1 text-center text-[9px] font-bold py-1.5 rounded-lg ${
              n === 2 ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Bathrooms</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 text-center text-[9px] font-bold py-1.5 rounded-lg ${
              n === 2 ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Service</p>
      <div className="flex gap-1 mb-3">
        {["Regular", "Deep", "Move"].map((s, i) => (
          <div
            key={s}
            className={`flex-1 text-center text-[8px] font-semibold py-1.5 rounded-lg ${
              i === 0 ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <div className="bg-sky-50 rounded-xl p-2 mb-2 text-center">
        <p className="text-[8px] text-slate-400">Price per session</p>
        <p className="text-[22px] font-extrabold text-sky-600 leading-tight">$120</p>
      </div>
      <div className="bg-sky-500 rounded-xl py-2 text-center">
        <p className="text-[10px] font-bold text-white">Continue →</p>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="animate-float relative w-[256px] h-[520px] bg-slate-900 rounded-[44px] p-[10px] shadow-2xl shadow-slate-400/40">
      <div className="absolute -left-[3px] top-[76px]  w-[3px] h-6  bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[112px] w-[3px] h-9  bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[154px] w-[3px] h-9  bg-slate-700 rounded-l-sm" />
      <div className="absolute -right-[3px] top-[108px] w-[3px] h-12 bg-slate-700 rounded-r-sm" />
      <div className="w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-[10px] font-bold text-slate-800">9:41</span>
          <div className="w-[82px] h-[20px] bg-slate-900 rounded-full" />
          <div className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5 fill-slate-800" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <svg className="w-2.5 h-2.5 fill-slate-800" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33C16.4 22 17 21.4 17 20.67V5.33C17 4.6 16.4 4 15.67 4z" />
            </svg>
          </div>
        </div>
        <BookingPreview />
      </div>
    </div>
  );
}

function SMSCard() {
  return (
    <div className="w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5">
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800">Messages</p>
          <p className="text-[8px] text-slate-400">now</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5 mb-2">
        <div className="w-5 h-5 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-500">
          S
        </div>
        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-2.5 py-1.5">
          <p className="text-[9px] text-slate-700 leading-tight">How much for 3 bed / 2 bath?</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5 flex-row-reverse mb-2.5">
        <div className="w-5 h-5 bg-sky-500 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white">
          A
        </div>
        <div className="bg-sky-500 rounded-2xl rounded-br-sm px-2.5 py-1.5">
          <p className="text-[9px] text-white leading-tight">Hi! Use my booking link:</p>
          <p className="text-[8px] text-sky-200 font-mono mt-0.5">cleanclick.app/ana</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-2.5 py-2">
        <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <div>
          <p className="text-[9px] font-bold text-teal-700">Booking confirmed!</p>
          <p className="text-[7px] text-teal-500 mt-0.5">Sarah · Fri Mar 7 · Morning</p>
        </div>
      </div>
    </div>
  );
}

function CustomerProfileCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-72">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sm font-bold text-sky-600 shrink-0">
          SJ
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Sarah Johnson</p>
          <p className="text-xs text-slate-400">Cliente desde Jan 2026</p>
        </div>
        <span className="ml-auto bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Quinzenal</span>
      </div>
      <div className="space-y-2.5 mb-4">
        {[
          { label: "Endereço", value: "456 Pine Ave, Austin TX" },
          { label: "Pets", value: "Cachorro" },
          { label: "Entrada", value: "Código: 1234, toque a campainha" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <p className="text-xs text-slate-400 w-16 shrink-0 mt-0.5">{label}</p>
            <p className="text-xs font-semibold text-slate-700">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-sky-50 rounded-xl px-3 py-2.5">
        <div>
          <p className="text-[10px] text-slate-400">Próxima faxina</p>
          <p className="text-xs font-bold text-slate-800">Seg, 17 Mar · Manhã</p>
        </div>
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </div>
      <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="text-[10px] font-semibold text-green-700">Dados preenchidos automaticamente</p>
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    icon: (
      <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    text: "Fica respondendo mensagem sobre preço no WhatsApp, mesmo no meio de uma faxina",
  },
  {
    icon: (
      <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    text: "Perde minutos calculando quanto cobrar dependendo do tamanho da casa",
  },
  {
    icon: (
      <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    text: "Perde cliente porque demorou para responder — e ele contratou outra",
  },
  {
    icon: (
      <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    text: "Agenda bagunçada, horário marcado duas vezes, estresse desnecessário",
  },
];

const FEATURES = [
  {
    icon: <IconLink />,
    title: "Link com seu nome",
    body: "cleanclick.app/seu-nome pronto em minutos. Cole no WhatsApp, SMS ou bio do Instagram. O cliente vê o preço e agenda sozinho.",
    color: "bg-sky-50 text-sky-600",
    badge: null,
  },
  {
    icon: <IconDollar />,
    title: "Preço calculado na hora",
    body: "Defina sua fórmula uma vez. Regular, Deep ou Move-in/out — o sistema calcula automaticamente por tamanho e frequência.",
    color: "bg-teal-50 text-teal-600",
    badge: null,
  },
  {
    icon: <IconCalendar />,
    title: "Agenda inteligente",
    body: "Veja todos os agendamentos num calendário visual. Bloqueie dias ou só um turno. Adicione faxinas manualmente quando precisar.",
    color: "bg-violet-50 text-violet-600",
    badge: "Novo",
  },
  {
    icon: <IconUser />,
    title: "Perfil do cliente",
    body: "Clientes recorrentes não preenchem tudo de novo. Endereço, pets e instruções de entrada ficam salvos automaticamente.",
    color: "bg-amber-50 text-amber-600",
    badge: "Novo",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Configure em 5 minutos",
    body: "Coloque seu preço base, os dias que você trabalha e seus turnos. Pronto — seu link já está funcionando.",
  },
  {
    step: "02",
    title: "Mande o link para seus clientes",
    body: "Cole no WhatsApp, no SMS ou na bio do Instagram. O cliente abre, vê o preço e agenda — sem precisar de você.",
  },
  {
    step: "03",
    title: "Apareça só para trabalhar",
    body: "Você recebe as informações do agendamento prontas: nome, endereço, data e serviço. Sem negociação. Sem idas e vindas.",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Fernanda",
    city: "Austin, TX",
    initial: "MF",
    color: "bg-sky-500",
    text: "Antes eu ficava horas no celular tentando fechar um cliente. Hoje mando o link e ele chega com tudo preenchido. Parece que tenho uma secretária.",
  },
  {
    name: "Claudia R.",
    city: "Miami, FL",
    initial: "CR",
    color: "bg-violet-500",
    text: "Perdi muito cliente por demora na resposta. Desde que coloquei o link na bio do Instagram, recebo agendamento mesmo quando estou dentro de uma casa.",
  },
  {
    name: "Patrícia Souza",
    city: "Dallas, TX",
    initial: "PS",
    color: "bg-teal-500",
    text: "Achei que seria complicado, mas em 10 minutos meu link já estava no ar. Os clientes adoraram — disseram que pareceu muito profissional.",
  },
];

const PLAN_INCLUDES = [
  "Seu link personalizado (ex: cleanclick.app/seu-nome)",
  "Preço calculado automaticamente — sem fazer conta na mão",
  "Agenda mensal com calendário visual e controle de turnos",
  "Adicione faxinas manualmente quando precisar",
  "Perfil salvo do cliente — ele não preenche tudo de novo",
  "Cole o link no WhatsApp, SMS ou bio do Instagram",
  "Suporte em português via e-mail",
  "Cancele quando quiser — sem contrato, sem multa",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/cleaner/login"
              className="hidden sm:inline text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Entrar
            </Link>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Começar Grátis
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-sky-50 to-white pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                Para faxineiras brasileiras nos EUA
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Seu negócio de limpeza{" "}
                <span className="text-sky-500">no piloto automático.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-xl">
                Link de agendamento, preços automáticos, agenda organizada e perfil do cliente —
                tudo em um só lugar.{" "}
                <strong className="text-slate-700">Sem planilha, sem negociação, sem estresse.</strong>
              </p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-10">
                {[
                  "Agendamento online",
                  "Preços automáticos",
                  "Perfil do cliente",
                  "Agenda visual",
                ].map((tag) => (
                  <span key={tag} className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200 cursor-pointer"
                >
                  Quero meu link grátis por 7 dias →
                </a>
                <Link
                  href="/cleaner/login"
                  className="border-2 border-slate-200 text-slate-600 font-semibold text-lg px-8 py-4 rounded-2xl hover:border-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  Já tenho conta
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-5">
                Sem cartão agora · Cancele quando quiser · Configuração em 5 minutos
              </p>

              {/* SMS card — mobile only */}
              <div className="lg:hidden mt-10 flex justify-center">
                <SMSCard />
              </div>
            </div>

            {/* Right: phone + SMS overlay — desktop only */}
            <div
              className="hidden lg:block shrink-0 relative"
              style={{ width: 330, height: 590 }}
            >
              <div className="absolute top-0 right-0">
                <PhoneMockup />
              </div>
              <div className="absolute bottom-0 left-0 z-10">
                <SMSCard />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="bg-slate-900 py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
          {[
            ["100+", "faxineiras já simplificaram sua rotina"],
            ["4.9★", "avaliação média"],
            ["24/7", "agendamentos sem intervenção"],
            ["5 min", "para configurar e já estar no ar"],
          ].map(([stat, label]) => (
            <div key={label} className="flex items-center gap-2 text-white">
              <span className="font-extrabold text-sky-400 text-base">{stat}</span>
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problema ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Você se identifica com isso?
            </h2>
            <p className="text-slate-500 text-lg">
              Se sim, você não está sozinha — e existe uma saída.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAIN_POINTS.map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
              >
                {icon}
                <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-sky-50 border border-sky-200 rounded-2xl px-6 py-5 text-center">
            <p className="text-sky-800 font-semibold text-base">
              Isso é o que acontece quando você gerencia um negócio profissional
              com ferramentas que não foram feitas para isso.
            </p>
            <p className="text-sky-600 text-sm mt-2">
              O CleanClick foi criado exatamente para resolver isso.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Mais clientes, menos estresse, total controle — com as funcionalidades certas para o seu negócio.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                    {f.icon}
                  </div>
                  {f.badge && (
                    <span className="bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Pronta em menos de 10 minutos
            </h2>
            <p className="text-slate-500 text-lg">Três passos. Sem complicação.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="text-center relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+28px)] right-0 h-px bg-slate-200" />
                )}
                <div className="w-14 h-14 bg-sky-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-extrabold shadow-lg shadow-sky-200 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200 cursor-pointer"
            >
              Criar meu link agora →
            </a>
          </div>
        </div>
      </section>

      {/* ── Demo Tabs ── */}
      <DemoTabs />

      {/* ── Customer Profile Section ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">

            {/* Right: visual */}
            <div className="flex justify-center shrink-0">
              <CustomerProfileCard />
            </div>

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                Clientes Recorrentes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5">
                Seus clientes fixos{" "}
                <span className="text-amber-600">agendam ainda mais rápido.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Quando um cliente agenda pela segunda vez, o sistema já conhece ele.
                Endereço, instrução de entrada, pets — tudo preenchido automaticamente.
                Ele só confirma e pronto.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                {[
                  "Dados do cliente salvos com segurança após o primeiro agendamento",
                  "Histórico de faxinas organizadas por cliente",
                  "Desconto de frequência aplicado automaticamente para recorrentes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Channels highlight ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-sky-500 to-teal-500 rounded-3xl p-8 sm:p-12 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              Um link que funciona em qualquer canal
            </h2>
            <p className="text-sky-100 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Mande pelo <strong className="text-white">WhatsApp</strong>,{" "}
              <strong className="text-white">SMS</strong> ou cole na bio do{" "}
              <strong className="text-white">Instagram</strong>. O cliente abre no celular,
              vê o preço exato, escolhe o horário e confirma.{" "}
              <strong className="text-white">Você recebe a notificação e vai trabalhar.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { label: "WhatsApp", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                { label: "SMS", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                { label: "Messenger", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                { label: "Instagram Bio", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
              ].map(({ label }) => (
                <span
                  key={label}
                  className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full"
                >
                  {label}
                </span>
              ))}
            </div>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-sky-600 font-bold text-base px-8 py-4 rounded-2xl hover:bg-sky-50 transition-colors shadow-lg cursor-pointer"
            >
              Quero meu link personalizado →
            </a>
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Quem já usou, não volta atrás
            </h2>
            <p className="text-slate-500 text-lg">
              Faxineiras reais que pararam de viver no celular.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <IconStar key={i} />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ── */}
      <section className="py-20 px-6 bg-white" id="precos">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Um plano. Tudo incluso.
            </h2>
            <p className="text-slate-500 text-lg">
              Comece grátis. Cancele quando quiser — sem contratos.
            </p>
          </div>
          <div className="max-w-sm mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-sky-500 to-teal-500 px-8 py-8 text-center text-white">
              <p className="text-sm font-bold uppercase tracking-widest text-sky-100 mb-2">Plano Pro</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-extrabold">$19</span>
                <span className="text-sky-200 text-base mb-2">/mês</span>
              </div>
              <p className="text-sky-100 text-sm mt-2">7 dias grátis · sem cartão agora</p>
            </div>
            <div className="px-8 py-7">
              <ul className="space-y-3 mb-8">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="text-sky-500 mt-0.5 shrink-0"><IconCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200 cursor-pointer"
              >
                Começar 7 dias grátis →
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">Cancele quando quiser. Sem multa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5">
            Sua concorrente já pode ter um link como esse.
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Enquanto você ainda está respondendo mensagem,
            ela pode estar recebendo agendamento automático. Não deixa para depois.
          </p>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xl px-10 py-5 rounded-2xl transition-colors shadow-xl shadow-sky-200 cursor-pointer"
          >
            Criar meu link grátis agora →
          </a>
          <p className="text-sm text-slate-400 mt-5">
            7 dias grátis · Sem cartão agora · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-500">Tire suas dúvidas antes de começar.</p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Preciso falar inglês para usar o sistema?",
                a: "Não! O painel de configuração é todo em português. Você define sua agenda, preços e preferências no seu idioma. O link que o cliente recebe é em inglês, mas simples e intuitivo — eles conseguem usar sem dificuldade.",
              },
              {
                q: "Como recebo o dinheiro das faxinas?",
                a: "O CleanClick organiza o agendamento — o pagamento você continua recebendo como preferir: Zelle, Venmo, Cash ou qualquer outro método. Você tem controle total sobre como quer ser paga.",
              },
              {
                q: "Posso adicionar faxinas manualmente pela agenda?",
                a: "Com certeza. Se um cliente ligar direto ou combinar de outra forma, você consegue adicionar o agendamento manualmente pelo seu painel. A agenda fica sempre atualizada.",
              },
              {
                q: "Posso cancelar o teste antes de ser cobrada?",
                a: "Com certeza! Se cancelar dentro dos 7 dias de teste, não haverá nenhuma cobrança. Basta acessar as configurações da sua conta e cancelar com um clique — sem burocracia, sem ligação, sem multa.",
              },
              {
                q: "O sistema funciona para qualquer tipo de faxina?",
                a: "Sim! Você configura preços para Regular Cleaning, Deep Cleaning e Move-in/Move-out. O sistema calcula automaticamente pelo tamanho da casa e tipo de serviço — sem você precisar fazer conta nenhuma.",
              },
              {
                q: "Quanto tempo leva para configurar tudo?",
                a: "A maioria das profissionais coloca o link no ar em menos de 10 minutos. Você preenche seus preços, marca os dias que trabalha e já está pronta para compartilhar.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-slate-800 text-sm sm:text-base hover:text-sky-600 transition-colors">
                  {q}
                  <span className="text-slate-400 text-xl leading-none shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-100 border-t border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo />
            <p className="text-slate-500 text-sm text-center">
              Servindo faxineiras brasileiras nos EUA
            </p>
            <Link
              href="/cleaner/login"
              className="text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Entrar na conta →
            </Link>
          </div>

          <div className="text-center bg-white rounded-2xl border border-slate-200 py-4 px-6">
            <p className="text-sm text-slate-500">
              Dúvidas? Fale conosco:{" "}
              <a
                href="mailto:contatocleanclick@gmail.com"
                className="text-sky-600 hover:underline font-semibold"
              >
                contatocleanclick@gmail.com
              </a>
              {" "}ou via{" "}
              <a
                href="https://wa.me/5521991588263"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline font-semibold"
              >
                WhatsApp
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} CleanClick. Todos os direitos reservados.</p>
            <div className="flex gap-5">
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
