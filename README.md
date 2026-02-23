# LeanReserve

A **Headless Booking Engine** for restaurants. Instead of complex visual floor plans, LeanReserve treats restaurant capacity as numerical inventory "resource buckets" (e.g., 5 tables of 2, 3 tables of 4). Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Booking Form**: Simple, accessible web form for customers to make reservations
- **AI Voice Agent Integration**: ElevenLabs-compatible API endpoint for phone-based bookings
- **Staff Dashboard**: Server-rendered daily booking list with client-side filtering
- **Inventory Management**: Configure table types and quantities (2-tops, 4-tops, etc.)
- **Automated Emails**: Confirmation emails sent via Resend when bookings are created
- **Resource Bucket Logic**: Smart availability calculation based on table capacity vs. bookings in 2-hour windows

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Booking   │     │  AI Voice Agent │     │  Staff Dashboard│
│   (app/book)    │     │ (ElevenLabs API)│     │(app/dashboard)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Next.js API Routes      │
                    │  (Availability Check)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Supabase             │
                    │  (PostgreSQL + Auth)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Edge Function           │
                    │  (Email Confirmation)     │
                    └───────────────────────────┘
```

### Database Schema

**restaurants**
- `id`, `name`, `email`, `timezone`, `owner_id`

**table_inventory**
- `id`, `restaurant_id`, `capacity`, `quantity`
- Tracks how many tables exist for each party size

**bookings**
- `id`, `restaurant_id`, `customer_name`, `customer_email`
- `booking_date`, `booking_time`, `guest_count`, `status`

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier works fine)
- (Optional) A Resend account for email testing

### 1. Clone and Install

```bash
git clone https://github.com/albgarrido/leanreserve-6038046.git
cd leanreserve-6038046
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project: **Project Settings > API**

### 3. Set Up Database

Run the migration in your Supabase SQL Editor:

```sql
-- See supabase/migrations/20260220000000_initial_schema.sql
-- This creates tables, triggers, and RLS policies
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create Your First Restaurant

1. Go to `/login` and sign up
2. Visit `/settings` to create your restaurant profile
3. Configure your table inventory (e.g., 5 tables of 2, 3 tables of 4)
4. Start taking bookings!

## ElevenLabs AI Agent Integration

LeanReserve provides a webhook endpoint for ElevenLabs AI voice agents to create bookings via phone conversations.

### Endpoint

```
POST /api/external/elevenlabs/booking
```

### Request Format

```json
{
  "restaurant_id": "uuid-of-restaurant",
  "customer_name": "John Smith",
  "customer_email": "john@example.com",
  "booking_date": "2024-03-15",
  "booking_time": "19:30",
  "guest_count": 4
}
```

### Response Format

**Success (201):**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid-of-booking",
    "status": "confirmed",
    "message": "Booking confirmed! Your reservation for 4 guests on March 15th, 2024 at 7:30 PM has been confirmed."
  }
}
```

**Error (409 - No Availability):**
```json
{
  "success": false,
  "error": {
    "code": "NO_AVAILABILITY",
    "message": "No availability for the requested time",
    "details": "Alternative times: 18:00, 20:00, 20:30"
  }
}
```

### ElevenLabs Configuration

1. Create a webhook tool in your ElevenLabs agent
2. Set the URL to: `https://your-domain.com/api/external/elevenlabs/booking`
3. Configure the request format as shown above
4. The AI can use the response message to speak confirmation to the caller

## Email Configuration

Confirmation emails are sent via a Supabase Edge Function using Resend.

### Setup

1. Get a Resend API key: https://resend.com/api-keys
2. Add to your Supabase Edge Function secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_key
   supabase secrets set FROM_EMAIL=bookings@yourdomain.com
   ```
3. Deploy the Edge Function:
   ```bash
   supabase functions deploy send-confirmation
   ```
4. Set up a database webhook in Supabase to trigger on `INSERT` to the `bookings` table

### Database Webhook Setup

1. Go to Supabase Dashboard > Database > Webhooks
2. Create a new webhook:
   - **Name**: `send-booking-confirmation`
   - **Table**: `bookings`
   - **Events**: `INSERT`
   - **Type**: `Supabase Function`
   - **Function**: `send-confirmation`

## Project Structure

```
leanreserve/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── bookings/             # Booking CRUD
│   │   ├── external/elevenlabs/  # AI Agent Integration
│   │   └── inventory/            # Inventory Management
│   ├── book/                     # Public Booking Form
│   ├── dashboard/                # Staff Dashboard
│   └── settings/                 # Inventory Configuration
├── components/                   # React Components
│   ├── ui/                       # Reusable UI (Button, Input, Card, Badge)
│   ├── BookingForm.tsx           # Public booking form
│   ├── BookingList.tsx           # Dashboard booking list
│   └── InventoryManager.tsx      # Inventory configuration
├── lib/                          # Utilities
│   ├── supabase.ts               # Supabase clients
│   └── availability.ts           # Resource bucket logic
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge Functions
├── types/                        # TypeScript types
│   ├── index.ts                  # Core types
│   ├── api.ts                    # API types
│   └── database.ts               # Supabase DB types
└── .env.example                  # Environment template
```

## Availability Logic

LeanReserve uses a "resource bucket" approach:

1. **Find Suitable Tables**: Identify table types with capacity ≥ guest count
2. **Calculate Total Capacity**: Sum quantities of suitable tables
3. **Check Existing Bookings**: Count confirmed bookings in the 2-hour window around requested time
4. **Determine Availability**: If `total_capacity > booked_tables`, the slot is available

Example:
- Inventory: 5 tables of 2, 3 tables of 4
- Request: 3 guests at 7:00 PM
- Suitable tables: All (2-tops can seat 1-2, 4-tops can seat 1-4)
- Total capacity: 8 tables
- Existing bookings 5:00-9:00 PM: 6 bookings
- **Available**: Yes (2 tables remaining)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy!

### Supabase Edge Functions

```bash
# Deploy email function
supabase functions deploy send-confirmation

# Set secrets
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set FROM_EMAIL=bookings@yourdomain.com
```

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: [Supabase Auth](https://supabase.com/auth)
- **Email**: [Resend](https://resend.com/)
- **AI Integration**: [ElevenLabs](https://elevenlabs.io/)

## License

MIT

## Contributing

This is a learning project. Feel free to fork and experiment!

## Support

For issues or questions, please open a GitHub issue.