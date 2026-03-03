import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function IconCheck() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
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

function IconShield() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <IconDollar />,
    title: "Preço Automático, Sem Negociação",
    body: "Você define seu preço base uma vez. O sistema calcula automaticamente o valor para cada combinação de quartos, banheiros e tipo de limpeza — Regular, Deep ou Move-in/out. Chega de calcular na mão.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: <IconCalendar />,
    title: "Sua Agenda, Seu Controle",
    body: "Configure os dias e turnos que você trabalha. O sistema só mostra horários disponíveis, evita conflitos com outros agendamentos e bloqueia datas de folga automaticamente.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: <IconLink />,
    title: "Um Link, Infinitos Clientes",
    body: "Você recebe um link personalizado — como cleanclick.app/maria-santos — que pode mandar pelo WhatsApp, SMS ou Messenger. O cliente agenda sozinho, em qualquer horário, sem precisar de você.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: <IconClock />,
    title: "Disponível 24 horas por Dia",
    body: "Enquanto você dorme, o link trabalha. Clientes podem ver preços e agendar às 23h de um sábado. Sem você precisar responder uma única mensagem.",
    color: "bg-amber-50 text-amber-600",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Configure em 5 minutos",
    body: "Coloque seu preço base, seus dias de trabalho e seus turnos preferidos. O sistema já está pronto.",
  },
  {
    step: "02",
    title: "Compartilhe seu link",
    body: "Mande o link pelo WhatsApp, SMS ou cole na bio do Instagram. Parece profissional desde o primeiro clique.",
  },
  {
    step: "03",
    title: "Receba agendamentos",
    body: "O cliente vê os preços, escolhe a data e confirma. Você recebe as informações prontas, sem ida e volta de mensagens.",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Fernanda",
    city: "Austin, TX",
    text: "Antes eu ficava horas no celular negociando preço. Agora mando o link e o cliente já chega com tudo agendado. Profissional demais.",
  },
  {
    name: "Claudia R.",
    city: "Miami, FL",
    text: "Minha renda aumentou porque parei de perder cliente por demora na resposta. O sistema agenda mesmo quando estou trabalhando.",
  },
  {
    name: "Patrícia Souza",
    city: "Dallas, TX",
    text: "Achei que ia ser complicado, mas em 10 minutos já tinha meu link no ar. Meus clientes adoraram a experiência.",
  },
];

const PLAN_INCLUDES = [
  "Link de agendamento personalizado (ex: cleanclick.app/seu-nome)",
  "Cálculo automático de preços por tamanho e tipo de limpeza",
  "Agenda semanal com controle de turnos e folgas",
  "Proteção contra double-booking",
  "Funciona no celular, tablet e computador",
  "Compartilhamento via WhatsApp, SMS e Messenger",
  "Cancele quando quiser — sem multa",
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
          <Link
            href="/cleaner/signup"
            className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Começar Grátis
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-sky-50 to-white pt-16 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Para profissionais de limpeza nos EUA
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            Sua Agenda de Faxinas{" "}
            <span className="text-sky-500">no Piloto Automático</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Pare de negociar orçamentos pelo WhatsApp. Tenha um link profissional
            que calcula preços e agenda faxinas para você —{" "}
            <strong className="text-slate-700">24 horas por dia, 7 dias por semana.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cleaner/signup"
              className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-sky-200"
            >
              Começar teste grátis de 7 dias →
            </Link>
            <Link
              href="/cleaner/login"
              className="border-2 border-slate-200 text-slate-600 font-semibold text-lg px-8 py-4 rounded-2xl hover:border-sky-300 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-5">
            Sem taxa de adesão · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="bg-slate-900 py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
          {[
            ["100+", "profissionais simplificaram sua rotina"],
            ["4.9★", "avaliação média"],
            ["24/7", "agendamentos automáticos"],
            ["0h", "de negociação por mensagem"],
          ].map(([stat, label]) => (
            <div key={label} className="flex items-center gap-2 text-white">
              <span className="font-extrabold text-sky-400 text-base">{stat}</span>
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Configuração Inteligente
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Você coloca o que costuma cobrar. O sistema faz toda a matemática por você.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
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

      {/* ── How it works ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Como funciona
            </h2>
            <p className="text-slate-500 text-lg">Em três passos simples.</p>
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
        </div>
      </section>

      {/* ── Channels highlight ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-sky-500 to-teal-500 rounded-3xl p-8 sm:p-12 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              Profissionalismo em qualquer canal
            </h2>
            <p className="text-sky-100 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Mande seu link pelo <strong className="text-white">WhatsApp</strong>,{" "}
              <strong className="text-white">SMS</strong> ou{" "}
              <strong className="text-white">Messenger</strong>. O cliente abre,
              vê os preços e agenda sozinho. Sem idas e vindas. Sem você parar no
              meio de uma faxina para responder mensagem.
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
            <Link
              href="/cleaner/signup"
              className="inline-block bg-white text-sky-600 font-bold text-base px-8 py-4 rounded-2xl hover:bg-sky-50 transition-colors shadow-lg"
            >
              Criar meu link agora →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              O que dizem as profissionais
            </h2>
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

      {/* ── Pricing ── */}
      <section className="py-20 px-6 bg-white" id="precos">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Preço simples e justo
            </h2>
            <p className="text-slate-500">Um plano. Tudo incluso. Sem surpresas.</p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-sky-500 shadow-xl shadow-sky-100 overflow-hidden">
            {/* Badge */}
            <div className="bg-sky-500 text-white text-sm font-bold text-center py-2.5 tracking-wide uppercase">
              7 dias grátis para começar
            </div>

            <div className="p-8">
              {/* Plan name & price */}
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                Automação Profissional
              </h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-sky-500">$19,99</span>
                <span className="text-slate-400 mb-1.5">/mês</span>
              </div>
              <p className="text-sm text-teal-600 font-semibold mb-6">
                ✓ Teste grátis por 7 dias — sem cobrança agora
              </p>

              {/* Includes */}
              <ul className="space-y-3 mb-8">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="text-teal-500 mt-0.5"><IconCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/cleaner/signup"
                className="block w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-center py-4 rounded-2xl transition-colors text-lg shadow-lg shadow-sky-200"
              >
                Comece seu teste grátis →
              </Link>

              {/* Fine print */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <IconShield />
                <p className="text-xs text-slate-400 text-center">
                  Cartão obrigatório para validação.{" "}
                  <strong className="text-slate-500">Cancele quando quiser com um clique.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5">
            Pronta para sair do WhatsApp e entrar no piloto automático?
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            Junte-se a mais de 100 profissionais que já pararam de perder tempo
            negociando preço por mensagem.
          </p>
          <Link
            href="/cleaner/signup"
            className="inline-block bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xl px-10 py-5 rounded-2xl transition-colors shadow-xl shadow-sky-200"
          >
            Começar teste grátis de 7 dias →
          </Link>
          <p className="text-sm text-slate-400 mt-5">
            Sem taxa de adesão · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="text-white font-extrabold">CleanClick</span>
          </div>
          <p className="text-slate-400 text-sm text-center">
            Feito para profissionais de limpeza nos EUA.
          </p>
          <Link
            href="/cleaner/login"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Entrar na conta →
          </Link>
        </div>
      </footer>

    </div>
  );
}
