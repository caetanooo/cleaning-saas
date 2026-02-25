import fs from "fs";
import path from "path";
import type { DB, Cleaner, Booking } from "@/types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const SEED: DB = {
  cleaners: [
    {
      id: "cleaner-1",
      name: "Maria Santos",
      email: "maria@sparkleclean.com",
      availability: {
        monday:    { morning: true,  afternoon: true  },
        tuesday:   { morning: true,  afternoon: true  },
        wednesday: { morning: true,  afternoon: true  },
        thursday:  { morning: true,  afternoon: true  },
        friday:    { morning: true,  afternoon: true  },
        saturday:  { morning: true,  afternoon: false },
        sunday:    { morning: false, afternoon: false },
      },
      pricingTable: {
        "1-1": 80,  "1-2": 95,  "1-3": 110, "1-4": 130, "1-5": 150,
        "2-1": 95,  "2-2": 115, "2-3": 135, "2-4": 155, "2-5": 175,
        "3-1": 115, "3-2": 140, "3-3": 160, "3-4": 185, "3-5": 210,
        "4-1": 135, "4-2": 165, "4-3": 190, "4-4": 220, "4-5": 250,
        "5-1": 160, "5-2": 195, "5-3": 225, "5-4": 260, "5-5": 295,
      },
      frequencyDiscounts: {
        weekly: 15,
        biweekly: 10,
        monthly: 5,
      },
    },
  ],
  bookings: [],
};

function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2));
    return SEED;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Cleaners ──────────────────────────────────────────────────────────────────

export function getCleaners(): Cleaner[] {
  return readDB().cleaners;
}

export function getCleanerById(id: string): Cleaner | undefined {
  return readDB().cleaners.find((c) => c.id === id);
}

export function createCleaner(cleaner: Cleaner): Cleaner {
  const db = readDB();
  db.cleaners.push(cleaner);
  writeDB(db);
  return cleaner;
}

export function updateCleaner(id: string, patch: Partial<Cleaner>): Cleaner | null {
  const db = readDB();
  const idx = db.cleaners.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.cleaners[idx] = { ...db.cleaners[idx], ...patch };
  writeDB(db);
  return db.cleaners[idx];
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function getBookings(cleanerId?: string): Booking[] {
  const db = readDB();
  if (cleanerId) return db.bookings.filter((b) => b.cleanerId === cleanerId);
  return db.bookings;
}

export function createBooking(booking: Booking): Booking {
  const db = readDB();
  db.bookings.push(booking);
  writeDB(db);
  return booking;
}

// ── Block conflict check ──────────────────────────────────────────────────────

export function isBlockTaken(
  cleanerId: string,
  date: string,
  timeBlock: "morning" | "afternoon",
  excludeBookingId?: string,
): boolean {
  return getBookings(cleanerId).some(
    (b) =>
      b.date === date &&
      b.timeBlock === timeBlock &&
      b.status !== "cancelled" &&
      b.id !== excludeBookingId,
  );
}
