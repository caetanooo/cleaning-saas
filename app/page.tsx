import Link from "next/link";
import DemoTabs from "./DemoTabs";

const CHECKOUT_URL = "https://buy.stripe.com/eVqeV6cfsbOmgz72zR57W00";

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

function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Mockup components ────────────────────────────────────────────────────────

function BookingPreview() {
  return (
    <div className="flex-1 overflow-hidden px-3 pb-3 pt-1">
      {/* URL bar */}
      <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 mb-3 gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
        <span className="text-[8px] text-slate-500 font-mono truncate">cleanclick.app/ana</span>
      </div>

      {/* Brand header */}
      <div className="text-center mb-2.5">
        <p className="text-[11px] font-extrabold text-slate-800">Ana&apos;s Cleaning ✨</p>
        <p className="text-[8px] text-sky-500 font-semibold">Book your cleaning</p>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-sky-500" : "bg-slate-200"}`} />
        ))}
      </div>

      {/* Bedrooms */}
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

      {/* Bathrooms */}
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

      {/* Service */}
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

      {/* Price display */}
      <div className="bg-sky-50 rounded-xl p-2 mb-2 text-center">
        <p className="text-[8px] text-slate-400">Price per session</p>
        <p className="text-[22px] font-extrabold text-sky-600 leading-tight">$120</p>
      </div>

      {/* CTA */}
      <div className="bg-sky-500 rounded-xl py-2 text-center">
        <p className="text-[10px] font-bold text-white">Continue →</p>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="animate-float relative w-[256px] h-[520px] bg-slate-900 rounded-[44px] p-[10px] shadow-2xl shadow-slate-400/40">
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-[76px]  w-[3px] h-6  bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[112px] w-[3px] h-9  bg-slate-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-[154px] w-[3px] h-9  bg-slate-700 rounded-l-sm" />
      <div className="absolute -right-[3px] top-[108px] w-[3px] h-12 bg-slate-700 rounded-r-sm" />

      {/* Screen */}
      <div className="w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-[10px] font-bold text-slate-800">9:41</span>
          {/* Dynamic Island */}
          <div className="w-[82px] h-[20px] bg-slate-900 rounded-full" />
          <div className="flex items-center gap-1">
            {/* WiFi icon */}
            <svg className="w-2.5 h-2.5 fill-slate-800" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            {/* Battery icon */}
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-sm">💬</div>
        <div>
          <p className="text-[10px] font-bold text-slate-800">Messages</p>
          <p className="text-[8px] text-slate-400">now</p>
        </div>
      </div>

      {/* Sarah's message */}
      <div className="flex items-end gap-1.5 mb-2">
        <div className="w-5 h-5 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-500">
          S
        </div>
        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-2.5 py-1.5">
          <p className="text-[9px] text-slate-700 leading-tight">How much for 3 bed / 2 bath? 🏠</p>
        </div>
      </div>

      {/* Ana's reply */}
      <div className="flex items-end gap-1.5 flex-row-reverse mb-2.5">
        <div className="w-5 h-5 bg-sky-500 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white">
          A
        </div>
        <div className="bg-sky-500 rounded-2xl rounded-br-sm px-2.5 py-1.5">
          <p className="text-[9px] text-white leading-tight">Hi Sarah! Use my link 👇</p>
          <p className="text-[8px] text-sky-200 font-mono mt-0.5">cleanclick.app/ana</p>
        </div>
      </div>

      {/* Confirmation */}
      <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-2.5 py-2">
        <span className="text-sm leading-none">✅</span>
        <div>
          <p className="text-[9px] font-bold text-teal-700">Booking confirmed!</p>
          <p className="text-[7px] text-teal-500 mt-0.5">Sarah · Fri Mar 7 · Morning</p>
        </div>
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    emoji: "📱",
    text: "Fica respondendo mensagem sobre preço no WhatsApp, mesmo no meio de uma faxina",
  },
  {
    emoji: "🧮",
    text: "Perde minutos calculando quanto cobrar dependendo do tamanho da casa",
  },
  {
    emoji: "😓",
    text: "Perde cliente porque demorou para responder — e ele contratou outra",
  },
  {
    emoji: "📅",
    text: "Agenda bagunçada, horário marcado duas vezes, estresse desnecessário",
  },
];

const BENEFITS = [
  {
    icon: <IconDollar />,
    title: "Nunca mais perca cliente por demora",
    body: "Seu link fica disponível 24h por dia. O cliente manda mensagem às 23h de um sábado, entra no link e agenda na hora — sem você precisar responder.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: <IconCalendar />,
    title: "Preço justo, sempre — sem calcular na mão",
    body: "Você define uma vez o que cobra. O sistema calcula automaticamente para qualquer tamanho de casa, tipo de limpeza e frequência. Sem erro, sem achismo.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: <IconLink />,
    title: "Pareça mais profissional do que nunca",
    body: "Um link com seu nome — tipo cleanclick.app/maria-santos — passa mais confiança do que qualquer conversa de WhatsApp. Seus clientes vão notar a diferença.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: <IconClock />,
    title: "Sua agenda no controle, sem conflito",
    body: "O sistema só mostra os horários que você definiu como disponíveis. Folga bloqueada, horário ocupado, feriado — tudo respeitado automaticamente.",
    color: "bg-amber-50 text-amber-600",
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
    text: "Antes eu ficava horas no celular tentando fechar um cliente. Hoje mando o link e ele chega com tudo preenchido. Parece que tenho uma secretária.",
  },
  {
    name: "Claudia R.",
    city: "Miami, FL",
    text: "Perdi muito cliente por demora na resposta. Desde que coloquei o link na bio do Instagram, recebo agendamento mesmo quando estou dentro de uma casa.",
  },
  {
    name: "Patrícia Souza",
    city: "Dallas, TX",
    text: "Achei que seria complicado, mas em 10 minutos meu link já estava no ar. Os clientes adoraram — disseram que pareceu muito profissional.",
  },
];


const PLAN_INCLUDES = [
  "Link de agendamento com seu nome (ex: cleanclick.app/seu-nome)",
  "Cálculo automático de preços por tamanho e tipo de limpeza",
  "Agenda semanal com controle de turnos e folgas",
  "Proteção contra double-booking (nunca mais horário duplicado)",
  "Funciona no celular, tablet e computador",
  "Compartilhamento via WhatsApp, SMS e Instagram",
  "Suporte em português via WhatsApp e e-mail",
  "Cancele quando quiser — sem multa, sem burocracia",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-900">CleanClick</span>
          </div>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Começar Grátis
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-sky-50 to-white pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                Para faxineiras brasileiras nos EUA
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Chega de negociar pelo WhatsApp.{" "}
                <span className="text-sky-500">Seus clientes agendam sozinhos.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 max-w-xl">
                Crie um link profissional com seu nome em menos de 5 minutos.
                O cliente vê o preço, escolhe o horário e confirma —{" "}
                <strong className="text-slate-700">sem você precisar responder uma única mensagem.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200"
                >
                  Quero meu link grátis por 7 dias →
                </a>
                <Link
                  href="/cleaner/login"
                  className="border-2 border-slate-200 text-slate-600 font-semibold text-lg px-8 py-4 rounded-2xl hover:border-sky-300 transition-colors"
                >
                  Já tenho conta
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-5">
                Sem cartão agora · Cancele quando quiser · Configuração em 5 minutos
              </p>

              {/* SMS card — mobile only (below CTAs, inline flow) */}
              <div className="lg:hidden mt-10 flex justify-center">
                <SMSCard />
              </div>
            </div>

            {/* Right: phone + SMS overlay — desktop only */}
            <div
              className="hidden lg:block shrink-0 relative"
              style={{ width: 330, height: 590 }}
            >
              {/* Phone floats top-right */}
              <div className="absolute top-0 right-0">
                <PhoneMockup />
              </div>
              {/* SMS card bottom-left, overlaps phone */}
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
            {PAIN_POINTS.map(({ emoji, text }) => (
              <div
                key={text}
                className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4"
              >
                <span className="text-2xl shrink-0">{emoji}</span>
                <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-sky-50 border border-sky-200 rounded-2xl px-6 py-5 text-center">
            <p className="text-sky-800 font-semibold text-base">
              Isso é o que acontece quando você está gerenciando um negócio profissional
              com ferramentas que não foram feitas para isso.
            </p>
            <p className="text-sky-600 text-sm mt-2">
              O CleanClick foi criado exatamente para resolver isso.
            </p>
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Mais clientes. Menos estresse. Total controle.
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Tudo que você precisa para crescer sem depender do celular o dia todo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFITS.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
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
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-sky-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-extrabold shadow-lg shadow-sky-200">
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
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200"
            >
              Criar meu link agora →
            </a>
          </div>
        </div>
      </section>

      {/* ── Demo Tabs ── */}
      <DemoTabs />

      {/* ── Channels highlight ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-sky-500 to-teal-500 rounded-3xl p-8 sm:p-12 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              Um link que você manda por qualquer canal
            </h2>
            <p className="text-sky-100 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Mande pelo <strong className="text-white">WhatsApp</strong>,{" "}
              <strong className="text-white">SMS</strong> ou cole na bio do{" "}
              <strong className="text-white">Instagram</strong>. O cliente abre no celular,
              vê o preço exato, escolhe o horário e confirma.{" "}
              <strong className="text-white">Você não precisa fazer mais nada.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {["💬 WhatsApp", "📱 SMS", "📘 Messenger", "📷 Instagram Bio"].map((ch) => (
                <span
                  key={ch}
                  className="bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-full"
                >
                  {ch}
                </span>
              ))}
            </div>
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-sky-600 font-bold text-base px-8 py-4 rounded-2xl hover:bg-sky-50 transition-colors shadow-lg"
            >
              Quero meu link personalizado →
            </a>
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section className="py-20 px-6 bg-white">
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
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <IconStar key={i} />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ── */}
      <section className="py-20 px-6 bg-slate-50" id="precos">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Escolha o seu plano
            </h2>
            <p className="text-slate-500 text-lg">
              Comece grátis. Cancele quando quiser — sem contratos.
            </p>
          </div>
          <div className="max-w-sm mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-br from-sky-500 to-teal-500 px-8 py-8 text-center text-white">
              <p className="text-sm font-bold uppercase tracking-widest text-sky-100 mb-2">Plano Pro</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-extrabold">$19</span>
                <span className="text-sky-200 text-base mb-2">/mês</span>
              </div>
              <p className="text-sky-100 text-sm mt-2">7 dias grátis · sem cartão agora</p>
            </div>
            {/* Features */}
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
                className="block w-full text-center bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200"
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
            ela pode estar recebendo agendamento automático.
            Não deixa para depois.
          </p>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xl px-10 py-5 rounded-2xl transition-colors shadow-xl shadow-sky-200"
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
                q: "Posso cancelar o teste antes de ser cobrada?",
                a: "Com certeza! Se cancelar dentro dos 7 dias de teste, não haverá nenhuma cobrança. Basta acessar as configurações da sua conta e cancelar com um clique — sem burocracia, sem ligação, sem multa.",
              },
              {
                q: "E se eu tiver dúvidas depois de criar minha conta?",
                a: "Nosso suporte é em português e está disponível via WhatsApp e e-mail para te ajudar com qualquer coisa. Ninguém fica sem resposta.",
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
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="text-xl font-extrabold text-slate-900">CleanClick</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              🇺🇸 Orgulhosamente servindo faxineiras brasileiras nos EUA
            </p>
            <Link
              href="/cleaner/login"
              className="text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
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
                className="text-teal-600 hover:underline font-semibold"
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
