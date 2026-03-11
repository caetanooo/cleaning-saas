import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js hydration scripts + Stripe.js
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              // Stripe pricing table iframe
              "frame-src https://js.stripe.com",
              // Supabase API + realtime + Stripe API
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              // Images from any HTTPS source + data URIs
              "img-src 'self' data: https:",
              // Tailwind inline styles
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
