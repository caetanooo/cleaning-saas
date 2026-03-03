"use client";

import Script from "next/script";

// Stripe Pricing Table is a web component — cast tag to avoid TS/ESLint issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StripePT = "stripe-pricing-table" as any;

export default function StripePricingTable() {
  return (
    <>
      <Script
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      <StripePT
        pricing-table-id="prctbl_1T6yJE4vRww4KMixFu9CHjSZ"
        publishable-key="pk_live_51T6iX34vRww4KMix6hBNlWN5WQCPHjnpdRnjYn3fMQPcxzWYCHootoXNIDsvHMql3apRXJZQocJcZgL5Xapc8IFk00Bmp1tpkY"
      />
    </>
  );
}
