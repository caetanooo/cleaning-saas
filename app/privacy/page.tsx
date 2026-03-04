import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade – CleanClick",
  description: "Como o CleanClick coleta, usa e protege suas informações pessoais.",
};

const LAST_UPDATED = "1º de março de 2026";
const CONTACT_EMAIL = "contatocleanclick@gmail.com";

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Política de Privacidade</h1>
            <p className="text-sm text-slate-400">Última atualização: {LAST_UPDATED}</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            O CleanClick (&quot;nós&quot;, &quot;nos&quot; ou &quot;nosso&quot;) está comprometido em proteger sua privacidade.
            Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos
            suas informações ao utilizar nossa plataforma, que conecta clientes a profissionais
            autônomos de limpeza.
          </p>

          <Section title="1. Informações que Coletamos">
            <p>Coletamos as seguintes categorias de informações pessoais:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Dados de conta:</strong> nome, e-mail e senha ao se cadastrar como profissional de limpeza.</li>
              <li><strong>Dados de agendamento:</strong> nome, telefone, endereço e preferências de serviço informados pelo cliente ao fazer uma reserva.</li>
              <li><strong>Dados de pagamento:</strong> informações de cobrança processadas com segurança pelo Stripe. Não armazenamos números completos de cartão em nossos servidores.</li>
              <li><strong>Dados de uso:</strong> endereço IP, tipo de navegador, páginas visitadas e registros de interação coletados automaticamente.</li>
            </ul>
          </Section>

          <Section title="2. Como Usamos Suas Informações">
            <ul className="list-disc pl-5 space-y-1">
              <li>Para fornecer, operar e melhorar a plataforma CleanClick.</li>
              <li>Para facilitar agendamentos entre clientes e profissionais de limpeza.</li>
              <li>Para processar pagamentos e gerenciar assinaturas.</li>
              <li>Para enviar comunicações transacionais (confirmações de agendamento, alertas de conta).</li>
              <li>Para detectar e prevenir fraudes ou uso indevido da plataforma.</li>
              <li>Para cumprir obrigações legais aplicáveis.</li>
            </ul>
          </Section>

          <Section title="3. Compartilhamento de Informações">
            <p>Não vendemos suas informações pessoais. Podemos compartilhá-las com:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Fornecedores de serviço:</strong> Supabase (banco de dados), Stripe (pagamentos) e Vercel (hospedagem), cada um vinculado a acordos de processamento de dados.</li>
              <li><strong>Entre usuários:</strong> os dados de contato do cliente são compartilhados com o profissional que recebe o agendamento, exclusivamente para a execução do serviço.</li>
              <li><strong>Autoridades legais:</strong> quando exigido por lei ou para proteger os direitos e a segurança dos nossos usuários.</li>
            </ul>
          </Section>

          <Section title="4. Cookies e Rastreamento">
            <p>
              Utilizamos cookies essenciais para manter sua sessão e estado de autenticação.
              Não utilizamos cookies de publicidade de terceiros. Você pode desativar os cookies
              nas configurações do seu navegador, embora algumas funcionalidades da plataforma
              possam não funcionar corretamente.
            </p>
          </Section>

          <Section title="5. Retenção de Dados">
            <p>
              Mantemos seus dados pessoais enquanto sua conta estiver ativa ou pelo tempo
              necessário para prestar os serviços. Registros de agendamento podem ser mantidos
              por até 3 anos para fins legais e contábeis. Você pode solicitar a exclusão
              da sua conta e dos dados associados a qualquer momento entrando em contato conosco.
            </p>
          </Section>

          <Section title="6. Seus Direitos">
            <p>Você pode ter o direito de:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acessar as informações pessoais que mantemos sobre você.</li>
              <li>Solicitar a correção de dados imprecisos.</li>
              <li>Solicitar a exclusão das suas informações pessoais.</li>
              <li>Opor-se a determinados usos dos seus dados.</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, envie um e-mail para{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-500 hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <Section title="7. Segurança">
            <p>
              Adotamos medidas de segurança padrão do setor, incluindo criptografia HTTPS,
              senhas com hash e segurança em nível de linha no banco de dados. No entanto,
              nenhum método de transmissão pela Internet é 100% seguro, e não podemos
              garantir segurança absoluta.
            </p>
          </Section>

          <Section title="8. Privacidade de Menores">
            <p>
              O CleanClick não é direcionado a menores de 18 anos. Não coletamos
              intencionalmente informações pessoais de menores. Se você acredita que um menor
              nos forneceu dados pessoais, entre em contato conosco imediatamente.
            </p>
          </Section>

          <Section title="9. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos
              os usuários cadastrados sobre mudanças relevantes por e-mail. O uso continuado
              da plataforma após as alterações entrarem em vigor constitui sua aceitação
              da política revisada.
            </p>
          </Section>

          <Section title="10. Fale Conosco">
            <p>
              Para dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato:
            </p>
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
