import Link from "next/link";

export const metadata = {
  title: "Terms of Use – CleanClick",
  description: "Terms and conditions governing your use of the CleanClick platform.",
};

const LAST_UPDATED = "March 1, 2026";
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
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-12 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Terms of Use</h1>
            <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Welcome to CleanClick. By accessing or using our platform, you agree to be
            bound by these Terms of Use. Please read them carefully. If you do not agree,
            do not use the platform.
          </p>

          <Section title="1. About the Platform">
            <p>
              CleanClick is a software-as-a-service (SaaS) platform that enables independent
              cleaning professionals (&quot;Cleaners&quot;) to manage their availability, pricing,
              and receive bookings from customers (&quot;Customers&quot;) through a shareable booking link.
            </p>
            <p>
              CleanClick is a technology platform only. We are not a cleaning company,
              employer, or staffing agency. All cleaning services are provided independently
              by Cleaners who use our platform.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old to create an account.</li>
              <li>Cleaners must provide accurate personal and business information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            </ul>
          </Section>

          <Section title="3. Cleaner Accounts and Subscriptions">
            <p>
              Cleaners access the platform through a paid subscription billed via Stripe.
              By subscribing, you authorize recurring charges to your payment method on the
              billing cycle selected at checkout.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
              <li>Access to the dashboard and booking link is contingent on an active subscription.</li>
              <li>We reserve the right to suspend or terminate accounts for non-payment or violation of these Terms.</li>
              <li>Refunds are handled on a case-by-case basis. Contact us within 7 days of a charge to request a review.</li>
            </ul>
          </Section>

          <Section title="4. Customer Bookings">
            <p>
              Customers may submit booking requests through a Cleaner&apos;s public booking link
              without creating an account. By submitting a booking, customers agree to provide
              accurate contact and service information.
            </p>
            <p>
              CleanClick does not guarantee the availability, quality, or outcome of any
              cleaning service. Any disputes regarding a cleaning service must be resolved
              directly between the Customer and the Cleaner.
            </p>
          </Section>

          <Section title="5. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the platform for any unlawful purpose or in violation of these Terms.</li>
              <li>Submit false, misleading, or fraudulent information.</li>
              <li>Attempt to access accounts or data that do not belong to you.</li>
              <li>Reverse-engineer, copy, or resell any part of the platform.</li>
              <li>Use automated tools to scrape or abuse the platform&apos;s APIs.</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All content, design, code, and branding on CleanClick are the exclusive
              property of CleanClick and are protected by applicable intellectual property laws.
              You may not reproduce or distribute any part of the platform without our
              prior written consent.
            </p>
          </Section>

          <Section title="7. Disclaimer of Warranties">
            <p>
              The platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
              any kind, express or implied, including but not limited to warranties of
              merchantability, fitness for a particular purpose, or non-infringement.
              We do not warrant that the platform will be uninterrupted or error-free.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, CleanClick shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising
              from your use of or inability to use the platform, even if we have been
              advised of the possibility of such damages. Our total liability to you for
              any claim shall not exceed the amount you paid us in the 3 months preceding
              the claim.
            </p>
          </Section>

          <Section title="9. Indemnification">
            <p>
              You agree to indemnify and hold CleanClick harmless from any claims, damages,
              losses, or expenses (including reasonable attorneys&apos; fees) arising from your
              use of the platform, your violation of these Terms, or your violation of any
              third-party rights.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              We may suspend or terminate your access to the platform at any time, with or
              without notice, for conduct that we determine violates these Terms or is harmful
              to other users, us, or third parties. You may cancel your account at any time
              by contacting us or managing your subscription through your billing portal.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Florida, United States,
              without regard to its conflict of law provisions. Any disputes arising under
              these Terms shall be subject to the exclusive jurisdiction of the courts
              located in Florida.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. We will notify
              registered Cleaners of material changes via email at least 7 days before
              they take effect. Continued use of the platform after changes take effect
              constitutes your acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              For questions about these Terms, please reach out:
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
