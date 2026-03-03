import type { Cleaner } from "@/types";

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

export function rowToCleaner(row: Record<string, unknown>): Cleaner {
  return {
    id:                 row.id    as string,
    name:               (row.name  as string) || "New Cleaner",
    email:              (row.email as string) || "",
    phone:              (row.phone              as string) || "",
    messengerUsername:  (row.messenger_username as string) || "",
    availability:       (row.availability        as Cleaner["availability"])        || DEFAULT_AVAILABILITY,
    blockedDates:       (row.blocked_dates       as Cleaner["blockedDates"])        || DEFAULT_BLOCKED_DATES,
    pricingFormula:     (row.pricing_formula     as Cleaner["pricingFormula"])      || DEFAULT_FORMULA,
    frequencyDiscounts: (row.frequency_discounts as Cleaner["frequencyDiscounts"])  || DEFAULT_DISCOUNTS,
    serviceAddons:      (row.service_addons      as Cleaner["serviceAddons"])       || DEFAULT_ADDONS,
    slug:               (row.slug                as string)                         || undefined,
    subscriptionStatus: (row.subscription_status as string)                         || undefined,
  };
}
