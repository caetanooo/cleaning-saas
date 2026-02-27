export type BookingStatus = "pending" | "confirmed" | "cancelled";

// Legacy types kept for component compatibility
export type ServiceType = "standard" | "deep" | "move_in_out";
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type FrequencyType = "one_time" | "weekly" | "biweekly" | "monthly";
export type CleaningServiceType = "regular" | "deep" | "move";
export type TimeBlock = "morning" | "afternoon";

/** Morning = 09:00–13:00 | Afternoon = 13:30–18:00 */
export interface DayAvailability {
  morning: boolean;
  afternoon: boolean;
}

export interface FrequencyDiscounts {
  weekly: number;    // percentage, e.g. 15
  biweekly: number;
  monthly: number;
}

export interface ServiceAddons {
  deep: number;  // extra $ for deep cleaning
  move: number;  // extra $ for move-in/out
}

/** Formula-based pricing: price = base + (beds-1)*extraPerBedroom + (baths-1)*extraPerBathroom */
export interface PricingFormula {
  base: number;
  extraPerBedroom: number;
  extraPerBathroom: number;
}

export interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  messengerUsername?: string;
  availability: Record<DayOfWeek, DayAvailability>;
  daysOff: string[];              // "YYYY-MM-DD" dates blocked regardless of weekly schedule
  pricingFormula: PricingFormula;
  frequencyDiscounts: FrequencyDiscounts;
  serviceAddons: ServiceAddons;
}

export interface Booking {
  id: string;
  cleanerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  hasPets: boolean;
  bedrooms: number;
  bathrooms: number;
  frequency: FrequencyType;
  date: string;        // "YYYY-MM-DD"
  timeBlock: TimeBlock;
  startTime: string;   // "09:00" | "13:30"
  endTime: string;     // "13:00" | "18:00"
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;   // ISO string
}

export interface BlockAvailability {
  morning: boolean;
  afternoon: boolean;
}

export interface DB {
  cleaners: Cleaner[];
  bookings: Booking[];
}
