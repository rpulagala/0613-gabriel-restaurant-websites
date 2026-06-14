# Sizzling Wok — Online Ordering System

Online pickup ordering for Gabriel's Chinese restaurant. Customers browse the menu, place orders, and pay via Stripe. Staff manage order status through a protected dashboard.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth.js v5 (Credentials — staff only) |
| Payments | Stripe (PaymentIntents + webhook) |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| Validation | Zod 4 |

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Stripe account (test keys are fine)
- Resend account (for confirmation emails)

## Setup

```bash
cd gabriel-restaurant
npm install
npx prisma generate          # generate Prisma client
```

Copy `.env.local.example` to `.env.local` and fill in all values (see [Environment Variables](#environment-variables) below).

```bash
npx prisma migrate dev --name init   # create tables
npx prisma db seed                   # seed menu + admin user
npm run dev                          # http://localhost:3000
```

> **No PostgreSQL locally?** Run `npx prisma dev` first — it starts a bundled local Postgres instance. Then use the printed connection URL as `DATABASE_URL` and run `prisma db push` instead of `migrate dev`.

## Environment Variables

Create `gabriel-restaurant/.env.local`:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/gabriel_restaurant

# Auth
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # stripe listen --print-secret

# Email
RESEND_API_KEY=re_...

# Restaurant info (shown in UI and emails)
RESTAURANT_NAME=Sizzling Wok
RESTAURANT_PHONE=(847) 555-0100
RESTAURANT_ADDRESS=Schaumburg, IL 60010
RESTAURANT_EMAIL=info@sizzlingwok.com
NEXT_PUBLIC_RESTAURANT_NAME=Sizzling Wok
NEXT_PUBLIC_RESTAURANT_PHONE=(847) 555-0100
NEXT_PUBLIC_RESTAURANT_ADDRESS=Schaumburg, IL 60010
```

## Running Locally

```bash
npm run dev                          # dev server (Turbopack)
npm run build && npm start           # production build

# In a second terminal (for real Stripe payments):
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Payment Testing Bypass

Stripe payment processing is currently **commented out** in `app/api/orders/route.ts` for easier testing. Orders are immediately marked `NEW` and appear on the dashboard without requiring a real Stripe transaction.

To re-enable real payments:
1. Remove the TESTING block at the top of `POST /api/orders`
2. Uncomment the Stripe PaymentIntent code below it
3. Start the Stripe webhook listener (see above)

## Staff Dashboard

URL: `/dashboard/login`

Default seed credentials:
- Email: `admin@restaurant.com`
- Password: `admin123`

**Change these before going to production** — update `prisma/seed.ts` or directly in the database.

## Menu Data

`prisma/seed.ts` contains representative placeholder prices. Replace item names and prices with the actual Sizzling Wok menu before going live. The seed covers 13 categories and 55 items.

## Deployment

The app is standard Next.js and deploys to any Node.js host:

- **Vercel** — zero config; set env vars in the dashboard; use Vercel Postgres or an external DB
- **Railway / Render** — add a Postgres service alongside the web service
- **Self-hosted** — `npm run build && npm start`, reverse-proxy with nginx

Set `NEXTAUTH_URL` and `AUTH_URL` to your production domain. Remove `AUTH_TRUST_HOST=true` if you're behind a trusted proxy that already sets the `Host` header correctly.
