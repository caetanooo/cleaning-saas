import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const services = [
  {
    title: "Standard Clean",
    icon: "🧹",
    price: "From $89",
    description:
      "Perfect for regular upkeep. We dust, vacuum, mop, and sanitize kitchens and bathrooms so your home stays fresh every week.",
    features: ["Dusting all surfaces", "Vacuum & mop floors", "Kitchen wipe-down", "Bathroom sanitizing"],
  },
  {
    title: "Deep Clean",
    icon: "✨",
    price: "From $179",
    description:
      "A thorough top-to-bottom scrub ideal for spring cleaning or homes that need extra attention after a long period.",
    features: ["Everything in Standard", "Inside oven & fridge", "Baseboards & window sills", "Cabinet fronts & handles"],
  },
  {
    title: "Move-In / Move-Out",
    icon: "📦",
    price: "From $249",
    description:
      "Leave your old place spotless or arrive to a fresh start. We handle the entire property so you can focus on the move.",
    features: ["Full Deep Clean", "Inside all cabinets", "Walls spot-cleaned", "Garage sweep-out"],
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    location: "Austin, TX",
    quote:
      "They transformed my apartment in just 2 hours. I've tried three other services and SparkleClean is miles ahead.",
    rating: 5,
  },
  {
    name: "James R.",
    location: "Denver, CO",
    quote:
      "Booked the move-out clean and got my full deposit back. Worth every penny — the landlord was genuinely impressed.",
    rating: 5,
  },
  {
    name: "Linda K.",
    location: "Phoenix, AZ",
    quote:
      "Reliable, thorough, and always on time. My house has never smelled this good. Highly recommend the deep clean.",
    rating: 5,
  },
];

const stats = [
  { value: "5,000+", label: "Homes Cleaned" },
  { value: "4.9 ★", label: "Average Rating" },
  { value: "100%", label: "Satisfaction Guarantee" },
  { value: "Insured", label: "& Background-Checked" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-lg">★</span>
      ))}
    </div>
  );
}

function ServiceCard({
  title,
  icon,
  price,
  description,
  features,
}: (typeof services)[0]) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col border border-sky-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sky-600 font-semibold text-lg mb-4">{price}</p>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>
      <ul className="space-y-2 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-slate-600 text-sm">
            <span className="text-sky-500 font-bold">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/book"
        className="block text-center bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
      >
        Get a Quote
      </Link>
    </div>
  );
}

function TestimonialCard({
  name,
  location,
  quote,
  rating,
}: (typeof testimonials)[0]) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <StarRating count={rating} />
      <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{name}</p>
        <p className="text-slate-400 text-xs">{location}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              SparkleClean
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#services" className="hover:text-sky-500 transition-colors">Services</Link>
            <Link href="#why-us" className="hover:text-sky-500 transition-colors">Why Us</Link>
            <Link href="#testimonials" className="hover:text-sky-500 transition-colors">Reviews</Link>
          </div>
          <Link
            href="/book"
            className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            Get a Quote
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-sky-50 via-white to-slate-50 py-24 md:py-36 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100 rounded-full opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-slate-100 rounded-full opacity-60 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <p className="inline-block bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            #1 Rated Cleaning Service
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Professional Home{" "}
            <span className="text-sky-500">Cleaning Services</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            We bring the sparkle back to your home. Trusted, insured, and
            background-checked cleaners — ready to book in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-sky-200 transition-all duration-200 hover:-translate-y-0.5"
            >
              Get a Free Quote
            </Link>
            <Link
              href="#services"
              className="bg-white border-2 border-sky-200 hover:border-sky-400 text-sky-600 font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              See Our Services
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            No credit card required · Free cancellation · 100% satisfaction guarantee
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="why-us" className="bg-sky-500">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-sky-100 text-sm mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Choose Your Clean
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From a weekly refresh to a full move-out scrub — we have a plan
              built for every situation and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-slate-500">Booking a clean has never been this easy.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              {
                step: "01",
                title: "Pick a service",
                body: "Choose the plan that fits your home and your schedule.",
              },
              {
                step: "02",
                title: "Book online",
                body: "Select a date, fill in your address, and confirm — done in 60 seconds.",
              },
              {
                step: "03",
                title: "Relax",
                body: "Our vetted team arrives on time and leaves your home spotless.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-extrabold text-lg mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-slate-500">Thousands of happy homeowners across the US.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Quote form ── */}
      <section id="quote" className="py-24 bg-gradient-to-br from-sky-500 to-sky-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Get Your Free Quote Today
          </h2>
          <p className="text-sky-100 mb-10">No commitment. No credit card. Just a clean home.</p>
          <form className="bg-white rounded-2xl p-8 shadow-2xl text-left space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Jane"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="jane@example.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Service</label>
              <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition bg-white text-slate-700">
                <option value="">Select a service…</option>
                <option value="standard">Standard Clean</option>
                <option value="deep">Deep Clean</option>
                <option value="move">Move-In / Move-Out</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 text-base"
            >
              Request My Free Quote →
            </button>
            <p className="text-center text-xs text-slate-400 pt-1">
              We'll reach out within 24 hours. No spam, ever.
            </p>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="text-white font-bold text-lg">SparkleClean</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} SparkleClean. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
