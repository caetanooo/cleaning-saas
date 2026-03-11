import Link from "next/link";

export const metadata = {
  title: "Termos de Uso – CleanClick",
  description: "Termos e condições que regem o uso da plataforma CleanClick.",
};

const LAST_UPDATED = "1º de março de 2026";
const CONTACT_EMAIL = "contatocleanclick@gmail.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-800">CleanClick</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Termos de Uso</h1>
            <p className="text-sm text-slate-400">Última atualização: {LAST_UPDATED}</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Bem-vindo ao CleanClick. Ao acessar ou utilizar nossa plataforma, você concorda
            em estar vinculado a estes Termos de Uso. Leia-os com atenção. Se não concordar,
            não utilize a plataforma.
          </p>

          <Section title="1. Sobre a Plataforma">
            <p>
              O CleanClick é uma plataforma de software como serviço (SaaS) que permite a
              profissionais autônomos de limpeza (&quot;Profissionais&quot;) gerenciar sua disponibilidade,
              preços e receber agendamentos de clientes (&quot;Clientes&quot;) por meio de um link
              de agendamento personalizado.
            </p>
            <p>
              O CleanClick é apenas uma plataforma tecnológica. Não somos uma empresa de
              limpeza, empregador ou agência de mão de obra. Todos os serviços de limpeza
              são prestados de forma independente pelos Profissionais que utilizam nossa plataforma.
            </p>
          </Section>

          <Section title="2. Elegibilidade">
            <ul className="list-disc pl-5 space-y-1">
              <li>Você deve ter pelo menos 18 anos para criar uma conta.</li>
              <li>Os Profissionais devem fornecer informações pessoais e profissionais precisas no cadastro.</li>
              <li>Você é responsável por manter a confidencialidade das suas credenciais de acesso.</li>
            </ul>
          </Section>

          <Section title="3. Contas de Profissional e Assinaturas">
            <p>
              Os Profissionais acessam a plataforma por meio de uma assinatura paga cobrada
              pelo Stripe. Ao assinar, você autoriza cobranças recorrentes no método de
              pagamento escolhido no ciclo de faturamento selecionado.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>As assinaturas são renovadas automaticamente, salvo cancelamento antes da data de renovação.</li>
              <li>O acesso ao painel e ao link de agendamento está condicionado a uma assinatura ativa.</li>
              <li>Reservamo-nos o direito de suspender ou encerrar contas por inadimplência ou violação destes Termos.</li>
              <li>Reembolsos são analisados caso a caso. Entre em contato em até 7 dias após uma cobrança para solicitar revisão.</li>
            </ul>
          </Section>

          <Section title="4. Agendamentos de Clientes">
            <p>
              Os Clientes podem solicitar agendamentos pelo link público do Profissional sem
              criar uma conta. Ao enviar um agendamento, o Cliente concorda em fornecer
              informações de contato e de serviço precisas.
            </p>
            <p>
              O CleanClick não garante a disponibilidade, qualidade ou resultado de qualquer
              serviço de limpeza. Quaisquer disputas relacionadas a um serviço devem ser
              resolvidas diretamente entre o Cliente e o Profissional.
            </p>
          </Section>

          <Section title="5. Condutas Proibidas">
            <p>Você concorda em não:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Usar a plataforma para qualquer finalidade ilegal ou em violação destes Termos.</li>
              <li>Fornecer informações falsas, enganosas ou fraudulentas.</li>
              <li>Tentar acessar contas ou dados que não lhe pertencem.</li>
              <li>Fazer engenharia reversa, copiar ou revender qualquer parte da plataforma.</li>
              <li>Usar ferramentas automatizadas para raspar ou abusar das APIs da plataforma.</li>
            </ul>
          </Section>

          <Section title="6. Propriedade Intelectual">
            <p>
              Todo o conteúdo, design, código e marca do CleanClick são propriedade exclusiva
              do CleanClick e estão protegidos pelas leis de propriedade intelectual aplicáveis.
              Você não pode reproduzir ou distribuir qualquer parte da plataforma sem nosso
              consentimento prévio por escrito.
            </p>
          </Section>

          <Section title="7. Isenção de Garantias">
            <p>
              A plataforma é fornecida &quot;no estado em que se encontra&quot; e &quot;conforme disponível&quot;,
              sem garantias de qualquer tipo, expressas ou implícitas, incluindo, mas não
              se limitando a, garantias de comerciabilidade, adequação a uma finalidade
              específica ou não violação. Não garantimos que a plataforma será ininterrupta
              ou livre de erros.
            </p>
          </Section>

          <Section title="8. Limitação de Responsabilidade">
            <p>
              Na máxima extensão permitida por lei, o CleanClick não será responsável por
              quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos
              decorrentes do uso ou da impossibilidade de uso da plataforma. Nossa
              responsabilidade total perante você por qualquer reclamação não excederá o
              valor pago por você nos 3 meses anteriores ao evento que originou o dano.
            </p>
          </Section>

          <Section title="9. Indenização">
            <p>
              Você concorda em indenizar e isentar o CleanClick de quaisquer reclamações,
              danos, perdas ou despesas (incluindo honorários advocatícios razoáveis)
              decorrentes do seu uso da plataforma, da sua violação destes Termos ou da
              violação de direitos de terceiros.
            </p>
          </Section>

          <Section title="10. Rescisão">
            <p>
              Podemos suspender ou encerrar seu acesso à plataforma a qualquer momento,
              com ou sem aviso prévio, por conduta que consideremos violar estes Termos ou
              prejudicial a outros usuários. Você pode cancelar sua conta a qualquer momento
              entrando em contato conosco ou gerenciando sua assinatura pelo portal de cobrança.
            </p>
          </Section>

          <Section title="11. Lei Aplicável">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer
              disputas decorrentes destes Termos serão submetidas ao foro da comarca do
              Rio de Janeiro — RJ, com renúncia expressa a qualquer outro, por mais privilegiado
              que seja.
            </p>
          </Section>

          <Section title="12. Alterações nestes Termos">
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento.
              Notificaremos os Profissionais cadastrados sobre mudanças relevantes por e-mail
              com pelo menos 7 dias de antecedência. O uso continuado da plataforma após
              as alterações entrarem em vigor constitui sua aceitação dos Termos revisados.
            </p>
          </Section>

          <Section title="13. Fale Conosco">
            <p>Para dúvidas sobre estes Termos, entre em contato:</p>
            <div className="mt-3 bg-slate-50 rounded-xl px-5 py-4 text-sm text-slate-700 space-y-1">
              <p className="font-semibold">CleanClick</p>
              <p>
                E-mail:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-500 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/5521991588263"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:underline"
                >
                  (21) 99158-8263
                </a>
              </p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} CleanClick. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-5 mt-2">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Política de Privacidade</Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Termos de Uso</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <div className="text-slate-600 leading-relaxed text-sm space-y-2">{children}</div>
    </section>
  );
}
