"use client";

import Script from "next/script";

const PRICING_TABLE_HTML = `<stripe-pricing-table
  pricing-table-id="prctbl_1T6yJE4vRww4KMixFu9CHjSZ"
  publishable-key="pk_live_51T6iX34vRww4KMix6hBNlWN5WQCPHjnpdRnjYn3fMQPcxzWYCHootoXNIDsvHMql3apRXJZQocJcZgL5Xapc8IFk00Bmp1tpkY"
></stripe-pricing-table>`;

export default function StripePricingTable() {
  return (
    <>
      <Script
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      <div
        style={{ minHeight: 400 }}
        dangerouslySetInnerHTML={{ __html: PRICING_TABLE_HTML }}
      />
    </>
  );
}
