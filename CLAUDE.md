# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

The app is **fully built and tested** in the `gabriel-restaurant/` subdirectory.

To run it fresh on a new machine:
1. Copy `.env.local` with real credentials (see README)
2. `npx prisma generate`
3. `npx prisma migrate dev --name init` (or `prisma db push` with a local Prisma dev DB)
4. `npx prisma db seed`
5. Replace placeholder prices in `prisma/seed.ts` with actual Sizzling Wok menu data

**Payment bypass is active** — Stripe is commented out in `app/api/orders/route.ts` for testing. Orders go straight to `NEW` status on the dashboard.

## Commands (run from `gabriel-restaurant/`)

```bash
npm run dev          # Dev server on http://localhost:3000 (Turbopack)
npm run build        # Production build
npm run lint         # ESLint

npx prisma migrate dev --name <name>   # Apply schema changes + regenerate client
npx prisma generate                    # Regenerate Prisma client without migration
npx prisma db seed                     # Seed menu items + admin user
npx prisma studio                      # Browser UI to inspect DB
npx prisma dev                         # Start bundled local Postgres (no Docker needed)

stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Version Notes (Actual Installed Versions)

- **Next.js 16.2.9** — `params` and `searchParams` are **Promises**, must be `await`ed; proxy file is `proxy.ts` (not `middleware.ts` — that name is deprecated)
- **Prisma 7.8.0** — `provider = "prisma-client"` generator; client output at `app/generated/prisma/`; requires `@prisma/adapter-pg`; no `url` in datasource (pass via adapter constructor); seed command goes in `prisma.config.ts`, not `package.json`
- **NextAuth v5 beta.31** — auth proxy in `proxy.ts` (not `middleware.ts`); use `auth` exported from `lib/auth.ts`; `AUTH_URL` + `AUTH_TRUST_HOST` required alongside `NEXTAUTH_URL`
- **Stripe 22.2.1** — API version `2026-05-27.dahlia`
- **Zod 4.4.3** — backward-compatible for project schemas

## Architecture

**Two user types:**
- **Customer** — no login; browses menu, adds to cart, checks out, receives email receipt
- **Staff** — NextAuth.js v5 Credentials login at `/dashboard/login`; manages order statuses

**App Router structure:**
- `/` — SSR menu page → `<MenuBrowser>` client component
- `/checkout` — customer info form → (Stripe Elements when payment enabled)
- `/order-success` — shows confirmation; handles both `?orderNumber=` (bypass) and `?payment_intent=` (Stripe) params
- `/dashboard/(auth)/login` — public login page (separate route group, no auth layout)
- `/dashboard/(protected)/` — staff orders view and completed orders; auth checked in layout
- `/api/menu`, `/api/orders`, `/api/orders/[id]`, `/api/orders/today`, `/api/orders/success`, `/api/webhooks/stripe`, `/api/auth/[...nextauth]`

**Route groups:** Dashboard uses `(auth)` and `(protected)` groups so the login page is not wrapped by the auth-checking layout.

**Cart:** `CartProvider.tsx` wraps root `app/layout.tsx`; `useReducer` with `ADD_ITEM / REMOVE_ITEM / UPDATE_QUANTITY / CLEAR_CART`. State is in-memory only — not persisted to localStorage.

**Database models:** `MenuItem`, `Customer`, `Order`, `OrderItem`, `Payment`, `ClientUser`. `Customer` (unauthenticated shoppers) and `ClientUser` (staff) are deliberately separate models.

**Prisma client import:** `import { PrismaClient } from '@/app/generated/prisma/client'`

## Critical Implementation Constraints

**Decimal serialization:** Prisma returns `Decimal` objects for money fields. These cannot cross the RSC→Client boundary. Always convert to `number` in Server Components before passing to Client Components. Types: `SerializableMenuItem`, `SerializableOrderWithDetails` etc. in `types/index.ts`.

**Order lifecycle:** Order is created in the DB before payment succeeds. `Order.status` stays `PENDING` (invisible to staff) until the Stripe webhook fires and sets it to `NEW`. Staff never see unpaid orders. *(Payment is currently bypassed — orders go directly to `NEW`.)*

**Stripe webhook (`/api/webhooks/stripe`):** Use `await req.text()` — never `req.json()` — to preserve the raw body for `stripe.webhooks.constructEvent()` signature verification.

**Order creation sequence:** Prisma `$transaction` creates Customer + Order + OrderItems first. Stripe PaymentIntent is created *outside* the transaction. If Stripe fails, the orphaned order is deleted.

**Prices:** Always fetch `menuItem.price` from the DB server-side. Never trust client-submitted prices.

**Tax:** 9.5% (`TAX_RATE = 0.095`) in `lib/tax.ts`. Use `Math.round(... * 100) / 100` to avoid floating-point drift.

**Email failures are non-fatal:** Wrap `resend.emails.send()` in try/catch; log but never rethrow. Webhook must return `200` to Stripe even if email fails.

**Validation:** Phone must match `/^\d{10}$/`. Zod schemas in `lib/validations.ts`.

## Environment Variables

Required in `.env.local`:

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
AUTH_URL
AUTH_TRUST_HOST=true
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESTAURANT_NAME
RESTAURANT_PHONE
RESTAURANT_ADDRESS
RESTAURANT_EMAIL
NEXT_PUBLIC_RESTAURANT_NAME
NEXT_PUBLIC_RESTAURANT_PHONE
NEXT_PUBLIC_RESTAURANT_ADDRESS
```

## Seed Data

Admin credentials: `admin@restaurant.com` / `admin123` — change before production. Menu has 55 placeholder items across 13 categories. Replace with actual Sizzling Wok prices before go-live.
