**LeanReserve Implementation Tasks**

| # | Task | Key Deliverable |
|---|------|---------------|
| 1 | Basic Project Structure and Types | `types/index.ts` (Restaurant, TableInventory, Booking, BookingStatus); `types/api.ts` (ElevenLabs structures) |
| 2 | Supabase Client Configuration | `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 3 | Availability Logic Utility | `lib/availability.ts` - "Resource Bucket" calculation (table_inventory quantity vs bookings in 2-hour window) |
| 4 | Shared UI Components | `components/ui/` - Button, Input, Card, Badge (Tailwind) |
| 5 | Public Web Booking Form | `app/book/page.tsx`, `components/BookingForm.tsx` - validation, success state per PRD |
| 6 | ElevenLabs AI Agent API | `app/api/external/elevenlabs/booking/route.ts` - availability check, insert with service role key |
| 7 | Staff Dashboard: Booking List | `app/dashboard/page.tsx` - server-side daily fetch, client-side filter (Name, Time) |
| 8 | Inventory Configuration UI | `app/settings/page.tsx`, `components/InventoryManager.tsx` - update quantity by capacity (2-tops, 4-tops, etc.) |
| 9 | Email Notification Edge Function | `supabase/functions/send-confirmation/index.ts` - Resend API via `RESEND_API_KEY` |
| 10 | Documentation | `README.md` - architecture, local dev setup, `.env.example` vars, ElevenLabs API usage |

**Completed Tasks:**
- [x] **Task 1:** Basic Project Structure and Types