# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

The app is **fully built** in the `gabriel-restaurant/` subdirectory. The full implementation plan is in `plan.md`.

Next steps before the app can run:
1. Fill in `gabriel-restaurant/.env.local` with real credentials
2. Run `npx prisma migrate dev --name init` (needs a live PostgreSQL connection)
3. Run `npx prisma db seed`
4. Replace placeholder prices in `prisma/seed.ts` with actual Sizzling Wok menu data

## Commands (run from `gabriel-restaurant/`)

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint

npx prisma migrate dev --name <name>   # Apply schema changes + regenerate client
npx prisma generate                    # Regenerate Prisma client without migration
npx prisma db seed                     # Seed menu items + admin user
npx prisma studio                      # Browser UI to inspect DB

stripe listen --forward-to localhost:3000/api/webhooks/stripe  # Forward Stripe webhooks locally
```

## Version Notes (Actual Installed Versions)

- **Next.js 16.2.9** — `params` and `searchParams` in pages/layouts/route handlers are **Promises** and must be `await`ed
- **Prisma 7.8.0** — uses `provider = "prisma-client"` generator; client output at `app/generated/prisma/`; **requires `@prisma/adapter-pg`** (installed) — no `DATABASE_URL` in schema, pass via adapter constructor
- **NextAuth v5 beta.31** — `next-auth/middleware` is deprecated; use `auth` exported from `lib/auth.ts` directly in `middleware.ts`
- **Stripe 22.2.1** — API version `2026-05-27.dahlia`; `stripe.webhooks.constructEvent()` API unchanged
- **Zod 4.4.3** — backward-compatible for our schemas

## Architecture

**Two user types:**
- **Customer** — no login; browses menu, adds to cart, checks out with Stripe, receives email receipt
- **Staff** — NextAuth.js v5 Credentials login at `/dashboard/login`; manages order statuses

**App Router structure:**
- `/` — SSR menu page → `<MenuBrowser>` client component
- `/checkout` — two-step: customer info form → Stripe Elements
- `/order-success` — reads `?payment_intent` from URL, shows receipt (uses Suspense around `useSearchParams`)
- `/dashboard` — staff-only (middleware guards `dashboard/:path*`)
- `/api/menu`, `/api/orders`, `/api/orders/[id]`, `/api/orders/today`, `/api/orders/success`, `/api/webhooks/stripe`, `/api/auth/[...nextauth]`

**Cart:** `CartProvider.tsx` wraps root `app/layout.tsx`; `useReducer` with `ADD_ITEM / REMOVE_ITEM / UPDATE_QUANTITY / CLEAR_CART`.

**Database models:** `MenuItem`, `Customer`, `Order`, `OrderItem`, `Payment`, `ClientUser`. `Customer` (unauthenticated shoppers) and `ClientUser` (staff) are deliberately separate models.

**Prisma client import:** `import { PrismaClient } from '@/app/generated/prisma/client'` — generated on `prisma generate`. The `PrismaPg` adapter from `@prisma/adapter-pg` is required; see `lib/prisma.ts`.

## Critical Implementation Constraints

**Order lifecycle:** Order is created in the DB before payment succeeds. `Order.status` stays invisible to staff until the Stripe webhook fires and sets it to `NEW`. Staff never see unpaid orders.

**Stripe webhook (`/api/webhooks/stripe`):** Use `await req.text()` — never `req.json()` — to preserve the raw body required for `stripe.webhooks.constructEvent()` signature verification.

**Order creation sequence:** Prisma `$transaction` creates Customer + Order + OrderItems first. Stripe PaymentIntent is created *outside* the transaction. If Stripe fails, the orphaned order is deleted.

**Prices:** Always fetch `menuItem.price` from the DB server-side. Never trust client-submitted prices. Reject any cart item that is unavailable or missing.

**Tax:** 9.5% (`TAX_RATE = 0.095`) applied in `lib/tax.ts`. Use `Math.round(... * 100) / 100` to avoid floating-point drift.

**Email failures are non-fatal:** Wrap `resend.emails.send()` in try/catch; log the error but never rethrow. The webhook must return `200` to Stripe even if email fails.

**Validation:** Phone must match `/^\d{10}$/`. Zod schemas live in `lib/validations.ts`.

## Environment Variables

Required in `.env.local` (Prisma CLI also reads this file via `prisma.config.ts`):

```
DATABASE_URL                          # postgresql://USER:PASSWORD@HOST:5432/gabriel_restaurant
NEXTAUTH_SECRET                       # openssl rand -base64 32
NEXTAUTH_URL                          # http://localhost:3000
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET                 # from: stripe listen --print-secret
RESEND_API_KEY
RESTAURANT_NAME
RESTAURANT_PHONE
RESTAURANT_ADDRESS
RESTAURANT_EMAIL
NEXT_PUBLIC_RESTAURANT_NAME
NEXT_PUBLIC_RESTAURANT_PHONE
NEXT_PUBLIC_RESTAURANT_ADDRESS
```

## Seed Data Note

`prisma/seed.ts` uses representative Chinese restaurant menu items. **Manually replace all prices and item names with the actual Sizzling Wok menu** after the app is running (the live site blocks automated fetching). Admin credentials: `admin@restaurant.com` / `admin123`.
