# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js on port 3000)
npm run build    # Production build
npm run lint     # ESLint check
```

No tests are configured.

## Environment Variables

Requires a `.env.local` file (not committed). Three vars needed:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_URL` (no `NEXT_PUBLIC_` prefix) can also be set server-side only and takes precedence over `NEXT_PUBLIC_SUPABASE_URL` in server routes.

## Architecture

**CleanClick** is a two-sided SaaS: cleaners manage their availability/pricing via a dashboard; customers book through a shareable link.

### Data layer — Supabase

All persistence is in Supabase (PostgreSQL). Two tables:

- **`cleaners`** — one row per cleaner, with JSONB columns: `availability` (`Record<DayOfWeek, {morning, afternoon}>`), `pricing_formula`, `frequency_discounts`, `service_addons`, `blocked_dates` (string[]).
- **`bookings`** — one row per booking, snake_case columns mapped to camelCase TS types in `rowToBooking()` helpers.

`lib/supabase.ts` exports two factory functions:
- `createBrowserClient()` — anon key, used in `"use client"` pages, subject to RLS.
- `createServiceClient()` — service role key, used only in API routes, bypasses RLS.

### API routes (`app/api/`)

| Route | Methods | Purpose |
|---|---|---|
| `/api/cleaners` | GET | List all cleaners |
| `/api/cleaners/[id]` | GET, PUT | Get or update a cleaner profile. GET auto-creates a row if auth user exists but has no row yet. PUT requires `Authorization: Bearer <token>` and validates `user.id === id`. |
| `/api/availability` | GET `?cleanerId=&date=` | Returns `{morning, afternoon}` booleans after checking weekly schedule, `blocked_dates`, existing bookings, and time-of-day cutoffs (+30 min buffer). |
| `/api/bookings` | GET `?cleanerId=`, POST | List bookings for a cleaner; create a booking (calculates price server-side, race-condition guard via pre-insert conflict check → 409). |
| `/api/bookings/[id]` | PATCH | Cancel a booking. Requires auth token; verifies the booking belongs to the authenticated cleaner. |
| `/api/vip/check` | GET | Returns `{isVip: boolean}` for the authenticated user. VIP users bypass the subscription paywall. |

### VIP system (`lib/vip.ts`)

Users in the VIP list get free access to the dashboard without a paid subscription. The check is server-side — `GET /api/vip/check` validates the auth token via Supabase and compares the user's email against `VIP_EMAILS` in `lib/vip.ts`.

**To add a new VIP:** edit `lib/vip.ts`, add the email to the `VIP_EMAILS` array, and redeploy. No environment variables needed — works in all environments.

### Pricing formula (server-side, also mirrored client-side for display)

```
baseTotal = formula.base + (beds-1) * extraPerBedroom + (baths-1) * extraPerBathroom
addon     = serviceType === "deep" ? addons.deep : serviceType === "move" ? addons.move : 0
subtotal  = baseTotal + addon
discountPct = frequencyDiscounts[frequency] or 0
totalPrice = round(subtotal * (1 - discountPct/100), 2)
```

### Booking wizard (`app/book/page.tsx`)

4-step wizard wrapped in `<Suspense>` (required for `useSearchParams`). Steps: House Size + Service Type → Frequency → Date & Time Block → Contact Info → Confirmation screen.

Required date count per frequency: `one_time=1, monthly=1, biweekly=2, weekly=4`.

On confirmation, shows SMS `sms:` deep-link and/or Facebook Messenger button (copies booking details to clipboard then opens `m.me/<username>`).

### Cleaner dashboard (`app/cleaner/`)

All cleaner pages are `"use client"`. Auth guard pattern: `useEffect` on mount calls `supabase.auth.getSession()`, redirects to `/cleaner/login` if no session, stores `session.access_token` in state for subsequent API calls.

- `/cleaner/login` — email/password + Google OAuth (`signInWithOAuth`)
- `/cleaner/signup` — email/password signup; stores `name` in `user_metadata`
- `/auth/callback` — PKCE code exchange (single-use, guarded with `useRef`)
- `/cleaner/setup` — availability checkboxes, formula-based pricing config, blocked dates, booking link copy
- `/cleaner/agenda` — calendar view with booking indicators; click a day to see booking details or toggle block/cancel

### Design conventions

- **Colors:** `sky-500` primary, `slate-50` backgrounds, `slate-800/900` text
- **Radius:** `rounded-xl` / `rounded-2xl` throughout
- **Tailwind v4** syntax: `@import "tailwindcss"` (not `@tailwind base/...`)
- **No dark mode**
- The cleaner dashboard UI is in **Portuguese (pt-BR)**; the customer booking wizard (`/book`) is in **English**

### Types (`types/index.ts`)

`CleaningServiceType = "regular" | "deep" | "move"` is the active service type. `ServiceType` and `TimeSlot` are legacy exports kept for compatibility with unused components.

`TimeBlock = "morning" | "afternoon"` maps to fixed windows: Morning 09:00–13:00, Afternoon 13:30–18:00.
