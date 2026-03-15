import type { Cleaner, BlockedSlot } from "@/types";

/** Normalises the legacy string[] format to BlockedSlot[].
 *  Old: ["2024-03-15"]  → New: [{ date: "2024-03-15", period: "ALL_DAY" }]
 */
function normalizeBlockedDates(raw: unknown): BlockedSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { date: item, period: "ALL_DAY" as const };
    return item as BlockedSlot;
  });
}

// ── Defaults used when JSONB columns are NULL in the DB ───────────────────────

export const DEFAULT_AVAILABILITY: Cleaner["availability"] = {
  monday:    { morning: true,  afternoon: true  },
  tuesday:   { morning: true,  afternoon: true  },
  wednesday: { morning: true,  afternoon: true  },
  thursday:  { morning: true,  afternoon: true  },
  friday:    { morning: true,  afternoon: true  },
  saturday:  { morning: true,  afternoon: false },
  sunday:    { morning: false, afternoon: false },
};

export const DEFAULT_FORMULA: Cleaner["pricingFormula"] = {
  base: 90,
  extraPerBedroom: 20,
  extraPerBathroom: 15,
};

export const DEFAULT_DISCOUNTS: Cleaner["frequencyDiscounts"] = {
  weekly: 15, biweekly: 10, monthly: 5,
};

export const DEFAULT_ADDONS: Cleaner["serviceAddons"] = {
  deep: 50,
  move: 80,
};

export const DEFAULT_BLOCKED_DATES: Cleaner["blockedDates"] = [];

/** Public shape — omits private contact fields (email, phone). Used for unauthenticated requests. */
export function rowToPublicCleaner(row: Record<string, unknown>): Omit<Cleaner, "email" | "phone"> {
  const { email: _e, phone: _p, ...pub } = rowToCleaner(row);
  return pub;
}

export function rowToCleaner(row: Record<string, unknown>): Cleaner {
  return {
    id:                 row.id    as string,
    name:               (row.name  as string) || "New Cleaner",
    email:              (row.email as string) || "",
    phone:              (row.phone              as string) || "",
    messengerUsername:  (row.messenger_username as string) || "",
    availability:       (row.availability        as Cleaner["availability"])        || DEFAULT_AVAILABILITY,
    blockedDates:       normalizeBlockedDates(row.blocked_dates),
    pricingFormula:     (row.pricing_formula     as Cleaner["pricingFormula"])      || DEFAULT_FORMULA,
    frequencyDiscounts: (row.frequency_discounts as Cleaner["frequencyDiscounts"])  || DEFAULT_DISCOUNTS,
    serviceAddons:      (row.service_addons      as Cleaner["serviceAddons"])       || DEFAULT_ADDONS,
    slug:               (row.slug                as string)                         || undefined,
    subscriptionStatus: (row.subscription_status as string)                         || "trialing",
  };
}
