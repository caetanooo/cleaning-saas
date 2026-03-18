/**
 * Unit Tests: Dynamic Scheduling — Time Calculator
 *
 * Tests the pure functions in lib/timeCalculator.ts:
 * - calculateDuration()   — time equation with staff scaling
 * - hasOverlap()          — overlap detection with 45-min travel buffer
 * - getAvailableSlots()   — full slot generation
 * - bookingRowsToBlocks() — legacy/dynamic booking row normalization
 *
 * Run: npx jest __tests__/timeCalculator.test.ts
 */

import {
  calculateDuration,
  hasOverlap,
  getAvailableSlots,
  bookingRowsToBlocks,
  legacyBlockToMinutes,
  minutesToTime,
  timeToMinutes,
  SLOT_STEP_MINUTES,
} from "@/lib/timeCalculator";
import type { ProviderTimeConfig } from "@/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** 120-min base regular service, 30 min/bedroom, 20 min/bathroom */
const REGULAR_CONFIGS: ProviderTimeConfig[] = [
  {
    id: "1", providerId: "p1", serviceType: "regular",
    baseDuration: 120, roomType: "bedroom",  timePerRoom: 30,
    createdAt: "", updatedAt: "",
  },
  {
    id: "2", providerId: "p1", serviceType: "regular",
    baseDuration: 120, roomType: "bathroom", timePerRoom: 20,
    createdAt: "", updatedAt: "",
  },
];

/** Deep clean: 180-min base, 40 min/bedroom, 25 min/bathroom */
const DEEP_CONFIGS: ProviderTimeConfig[] = [
  {
    id: "3", providerId: "p1", serviceType: "deep",
    baseDuration: 180, roomType: "bedroom",  timePerRoom: 40,
    createdAt: "", updatedAt: "",
  },
  {
    id: "4", providerId: "p1", serviceType: "deep",
    baseDuration: 180, roomType: "bathroom", timePerRoom: 25,
    createdAt: "", updatedAt: "",
  },
];

const ALL_CONFIGS = [...REGULAR_CONFIGS, ...DEEP_CONFIGS];

// ─── calculateDuration ────────────────────────────────────────────────────────

describe("calculateDuration()", () => {
  test("returns null when no configs for service type", () => {
    const result = calculateDuration({
      serviceType: "move",
      bedrooms:    2,
      bathrooms:   1,
      staffCount:  1,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBeNull();
  });

  test("base case: 1 bedroom, 1 bathroom, staff 1", () => {
    // base=120, +1 bed×30=30, +1 bath×20=20 → total=170 / 1 = 170
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 1,
      bathrooms: 1,
      staffCount: 1,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBe(170);
  });

  test("3 bedrooms, 2 bathrooms, 1 staff member", () => {
    // base=120, 3×30=90, 2×20=40 → 250 / 1 = 250 min
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 3,
      bathrooms: 2,
      staffCount: 1,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBe(250);
  });

  test("3 bedrooms, 2 bathrooms, 2 staff → half duration", () => {
    // 250 / 2 = 125 (ceil)
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 3,
      bathrooms: 2,
      staffCount: 2,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBe(125);
  });

  test("3 bedrooms, 2 bathrooms, 3 staff → one-third duration (ceil)", () => {
    // 250 / 3 = 83.33 → ceil = 84
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 3,
      bathrooms: 2,
      staffCount: 3,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBe(84);
  });

  test("deep clean: 2 bedrooms, 2 bathrooms, 1 staff", () => {
    // base=180, 2×40=80, 2×25=50 → 310 / 1 = 310 min
    const result = calculateDuration({
      serviceType: "deep",
      bedrooms: 2,
      bathrooms: 2,
      staffCount: 1,
      timeConfigs: DEEP_CONFIGS,
    });
    expect(result).toBe(310);
  });

  test("staff count clamped to minimum 1", () => {
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 1,
      bathrooms: 1,
      staffCount: 0,
      timeConfigs: REGULAR_CONFIGS,
    });
    expect(result).toBe(170);  // same as staff=1
  });

  test("uses configs from mixed array correctly", () => {
    // Only regular configs should be used for regular service
    const result = calculateDuration({
      serviceType: "regular",
      bedrooms: 2,
      bathrooms: 1,
      staffCount: 1,
      timeConfigs: ALL_CONFIGS,
    });
    // base=120, 2×30=60, 1×20=20 → 200
    expect(result).toBe(200);
  });
});

// ─── hasOverlap ───────────────────────────────────────────────────────────────

describe("hasOverlap()", () => {
  test("no overlap when slot is after all bookings (with travel buffer)", () => {
    // Existing: 9:00–13:00 (540–780). With buffer: 495–825.
    // Candidate: 14:00 (840) + 120 min = 840–960. No overlap.
    const result = hasOverlap(840, 120, [{ startMin: 540, endMin: 780 }]);
    expect(result).toBe(false);
  });

  test("overlap when candidate starts during travel window after existing booking", () => {
    // Existing: 9:00–13:00 (540–780). Buffered end = 780+45 = 825.
    // Candidate: 13:30 (810) + 120 → 810–930. 810 < 825 → overlap.
    const result = hasOverlap(810, 120, [{ startMin: 540, endMin: 780 }]);
    expect(result).toBe(true);
  });

  test("overlap when candidate ends during travel window before existing booking", () => {
    // Existing: 14:00–18:00 (840–1080). Buffered start = 840-45 = 795.
    // Candidate: 10:00 (600) + 210 = 600–810. 795 < 810 → overlap.
    const result = hasOverlap(600, 210, [{ startMin: 840, endMin: 1080 }]);
    expect(result).toBe(true);
  });

  test("no overlap when exactly one travel gap apart", () => {
    // Existing: 9:00–11:00 (540–660). Buffered end = 660+45 = 705.
    // Candidate: 11:45 (705) + 120 = 705–825. 705 < 705 is false → no overlap.
    const result = hasOverlap(705, 120, [{ startMin: 540, endMin: 660 }]);
    expect(result).toBe(false);
  });

  test("returns false for empty existing blocks", () => {
    expect(hasOverlap(540, 240, [])).toBe(false);
  });

  test("detects overlap with second booking in list", () => {
    const blocks = [
      { startMin: 540, endMin: 660 },   // 9:00–11:00
      { startMin: 900, endMin: 1020 },  // 15:00–17:00
    ];
    // Candidate: 13:00 (780) + 180 = 780–960.
    // Second block buffered start = 900-45 = 855. 780 < 900+45(945) && 855 < 960 → overlap.
    expect(hasOverlap(780, 180, blocks)).toBe(true);
  });
});

// ─── getAvailableSlots ────────────────────────────────────────────────────────

describe("getAvailableSlots()", () => {
  const WORK_START = 9 * 60;    // 09:00
  const WORK_END   = 18 * 60;   // 18:00

  test("returns slots for an empty day", () => {
    const slots = getAvailableSlots(120, [], WORK_START, WORK_END);
    expect(slots.length).toBeGreaterThan(0);
    // First slot should be 09:00
    expect(slots[0].time).toBe("09:00");
    // Last slot: start + 120 <= 18:00 → last start = 16:00 (960)
    expect(slots[slots.length - 1].time).toBe("16:00");
  });

  test("slots are spaced by SLOT_STEP_MINUTES", () => {
    const slots = getAvailableSlots(60, [], WORK_START, WORK_END);
    if (slots.length >= 2) {
      expect(slots[1].startMin - slots[0].startMin).toBe(SLOT_STEP_MINUTES);
    }
  });

  test("removes slot that overlaps existing booking", () => {
    // Existing booking: 9:00–13:00. Buffered: 8:15–13:45.
    // A 120-min candidate at 9:00 → 9:00–11:00 overlaps with 8:15–13:45.
    const existingBlocks = [{ startMin: 540, endMin: 780 }];
    const slots = getAvailableSlots(120, existingBlocks, WORK_START, WORK_END);
    const nineAM = slots.find((s) => s.time === "09:00");
    expect(nineAM).toBeUndefined();
  });

  test("first available slot after morning booking is outside travel buffer", () => {
    // Existing: 9:00–11:00 (540–660). Buffered end = 705.
    // First valid start = 705 → round up to next 30-min = 720 (12:00)
    const existingBlocks = [{ startMin: 540, endMin: 660 }];
    const slots = getAvailableSlots(120, existingBlocks, WORK_START, WORK_END);
    // 705 = 11:45 — is exactly 705, slot at 705 should be ok (705 < 705 is false, no overlap)
    // But 705 isn't a multiple of SLOT_STEP_MINUTES (30). Step starts at 540, 570, ..., 690, 720.
    // 690 (11:30) + 120 = 810. 810 > 705? Yes. Does 690 overlap with buffered 495–705? 690 < 705 && 495 < 810 → yes!
    // 720 (12:00) + 120 = 840. 720 < 705? No. → no overlap. First valid = 12:00.
    const firstSlot = slots[0];
    expect(firstSlot.startMin).toBeGreaterThanOrEqual(705);
  });

  test("filters past slots for today (with buffer)", () => {
    // nowMin = 11:00 (660). Cutoff = 660 + 45 = 705.
    // Slots at 09:00 (540) and 09:30 (570) should be excluded.
    const slots = getAvailableSlots(120, [], WORK_START, WORK_END, 660);
    const ninethirty = slots.find((s) => s.time === "09:30");
    const eleven     = slots.find((s) => s.time === "11:00");
    expect(ninethirty).toBeUndefined();
    expect(eleven).toBeUndefined();
    // First valid would be at 12:00 (720) since cutoff=705
    const firstSlot = slots[0];
    expect(firstSlot.startMin).toBeGreaterThan(705);
  });

  test("returns empty when work window too short for duration", () => {
    // 1-hour window vs 3-hour job
    const slots = getAvailableSlots(180, [], 9 * 60, 10 * 60);
    expect(slots).toHaveLength(0);
  });

  test("slot endMin equals startMin + duration", () => {
    const slots = getAvailableSlots(90, [], WORK_START, WORK_END);
    for (const slot of slots) {
      expect(slot.endMin).toBe(slot.startMin + 90);
    }
  });
});

// ─── bookingRowsToBlocks ──────────────────────────────────────────────────────

describe("bookingRowsToBlocks()", () => {
  test("converts legacy morning block correctly", () => {
    const result = bookingRowsToBlocks([{ time_block: "morning" }]);
    expect(result).toEqual([{ startMin: 9 * 60, endMin: 13 * 60 }]);
  });

  test("converts legacy afternoon block correctly", () => {
    const result = bookingRowsToBlocks([{ time_block: "afternoon" }]);
    expect(result).toEqual([{ startMin: 13 * 60 + 30, endMin: 18 * 60 }]);
  });

  test("uses scheduled_start_at / scheduled_end_at when available", () => {
    const row = {
      time_block:          "morning",
      scheduled_start_at:  "2026-03-16T10:00:00.000Z",
      scheduled_end_at:    "2026-03-16T12:30:00.000Z",
    };
    const result = bookingRowsToBlocks([row]);
    // toISOString is UTC; adjust hours as parsed from UTC
    const startDate = new Date(row.scheduled_start_at);
    const endDate   = new Date(row.scheduled_end_at);
    const expectedStart = startDate.getHours() * 60 + startDate.getMinutes();
    const expectedEnd   = endDate.getHours()   * 60 + endDate.getMinutes();
    expect(result[0]).toEqual({ startMin: expectedStart, endMin: expectedEnd });
  });

  test("handles empty array", () => {
    expect(bookingRowsToBlocks([])).toEqual([]);
  });

  test("mixes legacy and dynamic bookings", () => {
    const rows = [
      { time_block: "morning" },
      {
        time_block:         "afternoon",
        scheduled_start_at: "2026-03-16T14:00:00.000Z",
        scheduled_end_at:   "2026-03-16T17:00:00.000Z",
      },
    ];
    const result = bookingRowsToBlocks(rows);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(legacyBlockToMinutes("morning"));
    // Second row uses timestamps
    const d1 = new Date("2026-03-16T14:00:00.000Z");
    const d2 = new Date("2026-03-16T17:00:00.000Z");
    expect(result[1]).toEqual({
      startMin: d1.getHours() * 60 + d1.getMinutes(),
      endMin:   d2.getHours() * 60 + d2.getMinutes(),
    });
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

describe("minutesToTime() / timeToMinutes()", () => {
  test("minutesToTime converts correctly", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(540)).toBe("09:00");
    expect(minutesToTime(810)).toBe("13:30");
    expect(minutesToTime(1080)).toBe("18:00");
  });

  test("timeToMinutes converts correctly", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("13:30")).toBe(810);
    expect(timeToMinutes("18:00")).toBe(1080);
  });

  test("roundtrip", () => {
    const times = ["09:00", "09:30", "13:30", "16:00", "18:00"];
    for (const t of times) {
      expect(minutesToTime(timeToMinutes(t))).toBe(t);
    }
  });
});

// ─── New scheduling rules (workEnd = 23:00) ───────────────────────────────────

describe("Scheduling with workEnd = 23:00", () => {
  const WORK_START = 9 * 60;   // 09:00
  const WORK_END   = 23 * 60;  // 23:00

  test("7h job (420 min) last available slot is 16:00, not 17:00", () => {
    const slots = getAvailableSlots(420, [], WORK_START, WORK_END);
    const lastSlot = slots[slots.length - 1];
    // 16:00 + 7h = 23:00 ✓ (fits exactly)
    expect(lastSlot.time).toBe("16:00");
    // 17:00 slot must NOT exist (17:00 + 7h = 00:00, past 23:00)
    expect(slots.find((s) => s.time === "17:00")).toBeUndefined();
  });

  test("3h job (180 min) last available slot is 20:00", () => {
    const slots = getAvailableSlots(180, [], WORK_START, WORK_END);
    const lastSlot = slots[slots.length - 1];
    // 20:00 + 3h = 23:00 ✓
    expect(lastSlot.time).toBe("20:00");
  });

  test("1h job (60 min) last available slot is 22:00", () => {
    const slots = getAvailableSlots(60, [], WORK_START, WORK_END);
    const lastSlot = slots[slots.length - 1];
    // 22:00 + 1h = 23:00 ✓
    expect(lastSlot.time).toBe("22:00");
  });

  test("no slot causes booking to end past 23:00", () => {
    const slots = getAvailableSlots(120, [], WORK_START, WORK_END);
    for (const slot of slots) {
      expect(slot.endMin).toBeLessThanOrEqual(WORK_END);
    }
  });

  test("deep cleaning 7h with custom start at 07:00 has first slot at 07:00", () => {
    const slots = getAvailableSlots(420, [], 7 * 60, WORK_END);
    expect(slots[0].time).toBe("07:00");
    // last: 23:00 - 7h = 16:00
    expect(slots[slots.length - 1].time).toBe("16:00");
  });

  test("with existing 3h booking at 09:00, next 3h slot is outside travel buffer", () => {
    // Booking: 09:00–12:00 (540–720). Buffer end = 720+45 = 765 (12:45).
    // Next 30-min slot >= 765 is 780 = 13:00.
    const existingBlocks = [{ startMin: 540, endMin: 720 }];
    const slots = getAvailableSlots(180, existingBlocks, WORK_START, WORK_END);

    // No slots before travel buffer clears
    const tooEarly = slots.filter((s) => s.startMin < 765);
    expect(tooEarly).toHaveLength(0);

    // 13:00 (780) should be valid: 780 >= 765 and 780+180=960 <= 1380
    expect(slots.find((s) => s.time === "13:00")).toBeDefined();
  });

  test("two bookings split the day, middle gap only shows if large enough", () => {
    // Booking A: 09:00–11:00 (540–660). Buffer end = 705.
    // Booking B: 15:00–17:00 (900–1020). Buffer start = 855. Buffer end = 1065.
    // Gap between 705 and 855 = 150 min. A 2h (120 min) job should fit there.
    const existingBlocks = [
      { startMin: 540, endMin: 660 },
      { startMin: 900, endMin: 1020 },
    ];
    const slotsFor2h  = getAvailableSlots(120, existingBlocks, WORK_START, WORK_END);
    const slotsFor3h  = getAvailableSlots(180, existingBlocks, WORK_START, WORK_END);

    // At least one slot in the gap (12:00 or 12:30) for 2h job
    const gapSlots2h = slotsFor2h.filter((s) => s.startMin >= 705 && s.startMin < 855);
    expect(gapSlots2h.length).toBeGreaterThan(0);

    // 3h job (180 min) needs gap of 225min (180+45buffer). Gap=150 → no fit in middle.
    const gapSlots3h = slotsFor3h.filter((s) => s.startMin >= 705 && s.startMin < 855);
    expect(gapSlots3h).toHaveLength(0);
  });
});

// ─── Integration: full scenario ───────────────────────────────────────────────

describe("Integration: booking day with existing jobs", () => {
  test("cleaner with morning job has correct afternoon slots", () => {
    // Morning booking: 9:00–13:00 (540–780)
    const existingBlocks = [{ startMin: 540, endMin: 780 }];

    // Client wants 2h job
    const slots = getAvailableSlots(120, existingBlocks, 540, 1080);

    // All slots must not overlap with [9:00 - 45min, 13:00 + 45min] = [495, 825]
    for (const slot of slots) {
      // Slot interval: [slot.startMin, slot.startMin + 120]
      // Existing buffered: [495, 825]
      // No overlap means: slot.startMin >= 825 OR (slot.startMin + 120) <= 495
      const noOverlap = slot.startMin >= 825 || (slot.startMin + 120) <= 495;
      expect(noOverlap).toBe(true);
    }
  });

  test("staff_count=2 halves duration and opens more slots", () => {
    // 3 beds, 2 baths, staff=1: 250 min
    // 3 beds, 2 baths, staff=2: 125 min
    const dur1 = calculateDuration({
      serviceType: "regular", bedrooms: 3, bathrooms: 2,
      staffCount: 1, timeConfigs: REGULAR_CONFIGS,
    })!;
    const dur2 = calculateDuration({
      serviceType: "regular", bedrooms: 3, bathrooms: 2,
      staffCount: 2, timeConfigs: REGULAR_CONFIGS,
    })!;

    const slots1 = getAvailableSlots(dur1, [], 540, 1080);
    const slots2 = getAvailableSlots(dur2, [], 540, 1080);

    expect(dur2).toBeLessThan(dur1);
    expect(slots2.length).toBeGreaterThan(slots1.length);
  });
});
