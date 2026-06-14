# Sizzling Wok — Online Ordering System

Online pickup ordering for Gabriel's Chinese restaurant. Customers browse the menu, place orders, and pay via Stripe. Staff manage order status through a protected dashboard.

**Live demo:** https://gabriel-restaurant.vercel.app  
**Staff dashboard:** https://gabriel-restaurant.vercel.app/dashboard/login

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Neon Postgres via Prisma 7 + `@prisma/adapter-pg` |
| Auth | NextAuth.js v5 (Credentials — staff only) |
| Payments | Stripe (PaymentIntents + webhook) |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| Validation | Zod 4 |
| Hosting | Vercel (production) |

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted — see options below)
- Stripe account (test keys are fine)
- Resend account (for confirmation emails)

## Local Setup

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

## Mobile Support

The app is fully responsive. Key mobile-specific behaviours:

- **Login page** — full-screen white layout on mobile (floating card on desktop); `text-base` inputs prevent iOS auto-zoom on focus; restaurant name shown at top for branding
- **Dashboard nav** — bottom tab bar (Active Orders / Completed / Sign Out) on mobile; sidebar on desktop (`sm:`)
- **Orders list** — tap-friendly cards on mobile showing order #, customer, items, time, total, and status badge; full table on desktop (`md:`)
- **Order detail modal** — slides up as a bottom sheet on mobile; centered dialog on desktop

Tested with Playwright on iPhone 14 (390px) and Pixel 5 (393px) — 26/26 tests pass.

## E2E Tests

```bash
node e2e-vercel.js       # desktop flows (14 tests)
node e2e-mobile.js       # iPhone 14 + Pixel 5 (26 tests)
```

Both suites run against the live Vercel URL. Screenshots saved to `e2e-screenshots/`.

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

`prisma/seed.ts` contains representative placeholder prices. Replace item names and prices with the actual Sizzling Wok menu before going live. The seed covers 13 categories and ~52 items.

## Deployment (Vercel + Neon)

The production app runs on Vercel with a Neon Postgres database provisioned via the Vercel Marketplace.

### First-time deploy

```bash
npm i -g vercel
vercel login
vercel link                          # link to project
vercel integration add neon          # provision Neon DB + inject DATABASE_URL
```

Add remaining env vars to Vercel production:

```bash
# Auth — write values to a file first to avoid PowerShell BOM encoding issues
echo -n "your-secret" > tmp.txt && npx vercel env add NEXTAUTH_SECRET production < tmp.txt
echo -n "https://your-domain.vercel.app" > tmp.txt
npx vercel env add NEXTAUTH_URL production < tmp.txt
npx vercel env add AUTH_URL production < tmp.txt
echo -n "true" > tmp.txt && npx vercel env add AUTH_TRUST_HOST production < tmp.txt
# ... repeat for STRIPE_*, RESEND_API_KEY, RESTAURANT_* vars
rm tmp.txt
```

> **PowerShell BOM warning:** Using `echo $var | vercel env add ...` in PowerShell pipes a UTF-8 BOM character into the value. This causes `TypeError: Invalid URL` in NextAuth at runtime. Always use file redirection (`< file`) or the Vercel dashboard to set string env vars from PowerShell.

Push schema and seed data:

```bash
# Use DATABASE_URL_UNPOOLED from .env.local for schema push
DATABASE_URL=<unpooled-url> npx prisma db push
npx prisma db seed
```

Deploy:

```bash
npx vercel --prod
```

### Subsequent deploys

Git push to `main` triggers auto-deploy via Vercel's GitHub integration.
