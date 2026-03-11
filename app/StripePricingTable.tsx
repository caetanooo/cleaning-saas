"use client";

import React from "react";
import Script from "next/script";

export default function StripePricingTable() {
  const tableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID ?? "";
  const pubKey  = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  ?? "";

  return (
    <>
      <Script
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {React.createElement("stripe-pricing-table", {
        "pricing-table-id": tableId,
        "publishable-key": pubKey,
        style: { minHeight: 400 },
      })}
    </>
  );
}
