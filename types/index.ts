export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type BlockedPeriod = "ALL_DAY" | "MORNING" | "AFTERNOON";

export interface BlockedSlot {
  date: string;           // "YYYY-MM-DD"
  period: BlockedPeriod;  // ALL_DAY | MORNING | AFTERNOON
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

export interface DayAvailability {
  morning: boolean;
  afternoon: boolean;
  startTime?: string;  // "HH:MM" — primeiro horário do dia (padrão: "09:00")
  endTime?: string;    // "HH:MM" — último horário do dia (padrão: "18:00")
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
  blockedDates: BlockedSlot[];    // specific date+period blocks (ALL_DAY | MORNING | AFTERNOON)
  pricingFormula: PricingFormula;
  frequencyDiscounts: FrequencyDiscounts;
  serviceAddons: ServiceAddons;
  slug?: string;
  subscriptionStatus?: string;   // 'active' | 'trialing' | 'inactive' | ...
  isVip?: boolean;               // true = bypasses subscription paywall
  defaultStaffCount?: { regular: number; deep: number; move: number };
}

export interface Booking {
  id: string;
  cleanerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  hasPets:     boolean;
  hasChildren: boolean;
  hasCarpet:   boolean;
  bedrooms: number;
  bathrooms: number;
  serviceType?: CleaningServiceType;  // stored only if service_type column exists in DB
  frequency: FrequencyType;
  date: string;        // "YYYY-MM-DD"
  timeBlock: TimeBlock;
  startTime: string;   // "09:00" | "13:30"
  endTime: string;     // "13:00" | "18:00"
  totalPrice: number;
  status: BookingStatus;
  source: "platform" | "manual";
  createdAt: string;   // ISO string
  // Dynamic scheduling fields (null for legacy bookings)
  estimatedDuration?: number;   // total minutes
  staffCount?: number;          // 1 | 2 | 3
  scheduledStartAt?: string;    // ISO timestamp
  scheduledEndAt?: string;      // ISO timestamp
}

export type RoomType = "bedroom" | "bathroom" | "kitchen" | "living_room";

/** Time configuration per service type and room type for dynamic scheduling */
export interface ProviderTimeConfig {
  id: string;
  providerId: string;
  serviceType: CleaningServiceType;
  baseDuration: number;   // minutes (base time regardless of room count)
  roomType: RoomType;
  timePerRoom: number;    // extra minutes per unit of this room type
  createdAt: string;
  updatedAt: string;
}

/** Input for duration calculation */
export interface DurationInput {
  serviceType: CleaningServiceType;
  bedrooms: number;
  bathrooms: number;
  kitchens?: number;
  livingRooms?: number;
  staffCount: number;
  timeConfigs: ProviderTimeConfig[];
}

export interface BlockAvailability {
  morning: boolean;
  afternoon: boolean;
}

export interface DB {
  cleaners: Cleaner[];
  bookings: Booking[];
}
