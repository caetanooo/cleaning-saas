import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – CleanClick",
  description: "How CleanClick collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "March 1, 2026";
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
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Privacy Policy</h1>
            <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            CleanClick (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our platform, which connects homeowners with independent
            cleaning professionals.
          </p>

          <Section title="1. Information We Collect">
            <p>We collect the following categories of personal information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account information:</strong> name, email address, and password when you sign up as a cleaning professional.</li>
              <li><strong>Booking information:</strong> name, phone number, address, and service preferences provided by customers when scheduling a cleaning.</li>
              <li><strong>Payment information:</strong> billing details processed securely through Stripe. We do not store full card numbers on our servers.</li>
              <li><strong>Usage data:</strong> IP address, browser type, pages visited, and interaction logs collected automatically.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, operate, and improve the CleanClick platform.</li>
              <li>To facilitate bookings between customers and cleaning professionals.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To send transactional communications (booking confirmations, account alerts).</li>
              <li>To detect and prevent fraud or misuse of the platform.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. Sharing of Information">
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Service providers:</strong> Supabase (database), Stripe (payments), and Vercel (hosting), each bound by data processing agreements.</li>
              <li><strong>Between users:</strong> Customer contact details are shared with the cleaning professional who receives a booking, and vice versa, solely to fulfill the service.</li>
              <li><strong>Legal authorities:</strong> when required by law or to protect the rights and safety of our users.</li>
            </ul>
          </Section>

          <Section title="4. Cookies and Tracking">
            <p>
              We use essential cookies to maintain your session and authentication state.
              We do not use third-party advertising cookies. You may disable cookies in
              your browser settings, though some features of the platform may not function correctly.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as
              needed to provide services. Booking records may be retained for up to 3 years
              for legal and accounting purposes. You may request deletion of your account
              and associated data at any time by contacting us.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your state of residence, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your personal information.</li>
              <li>Opt out of certain data uses.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-500 hover:underline">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We implement industry-standard security measures including HTTPS encryption,
              hashed passwords, and row-level security on our database. However, no method
              of transmission over the Internet is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              CleanClick is not directed to individuals under the age of 18. We do not
              knowingly collect personal information from minors. If you believe a minor
              has provided us with personal data, please contact us immediately.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify registered
              users of material changes via email. Continued use of the platform after
              changes take effect constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              For any questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 bg-slate-50 rounded-xl px-5 py-4 text-sm text-slate-700 space-y-1">
              <p className="font-semibold">CleanClick</p>
              <p>
                Email:{" "}
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
                  +55 21 99158-8263
                </a>
              </p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} CleanClick. All rights reserved.</p>
        <div className="flex justify-center gap-5 mt-2">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Use</Link>
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
