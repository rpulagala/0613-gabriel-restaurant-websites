# Restaurant Online Food Ordering System — Implementation Plan

## Context

Build a full-stack Next.js web application for Gabriel's restaurant. Customers order online without logging in; restaurant staff manage orders through a protected dashboard. Payments via Stripe, confirmation emails via Resend, 9.5% tax for zip code 60010, PostgreSQL via Prisma.

> **Menu note:** The Sizzling Wok website returns HTTP 403 to automated fetchers. The seed file will use a representative Chinese restaurant menu matching their known categories (Appetizer, Soup, Fried Rice, Lo Mein, Beef, Pork, Chicken, Seafood, Vegetable, Lunch Special, Chef's Special, Dessert, Drink). **After the app is built, manually update `prisma/seed.ts` with the exact items and prices from the live menu.**

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Payments | Stripe (Payment Intents + Elements) |
| Email | Resend |
| Auth | NextAuth.js v5 (Credentials provider) |
| Validation | Zod |
| Icons | lucide-react |
| Utilities | clsx, tailwind-merge, date-fns, bcryptjs |

---

## Phase 0: Project Scaffolding

```bash
npx create-next-app@latest gabriel-restaurant --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd gabriel-restaurant

npm install prisma @prisma/client
npm install next-auth@beta
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install resend
npm install bcryptjs zod clsx tailwind-merge lucide-react date-fns
npm install --save-dev @types/bcryptjs

npx prisma init
```

Create `.env.local`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/gabriel_restaurant"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
RESTAURANT_NAME="Sizzling Wok"
RESTAURANT_PHONE="(847) 555-0100"
RESTAURANT_ADDRESS="Schaumburg, IL 60173"
RESTAURANT_EMAIL="info@sizzlingwokil.com"
```

---

## Phase 1: Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MenuItem {
  id          String      @id @default(cuid())
  name        String
  description String?
  price       Decimal     @db.Decimal(10, 2)
  category    String
  imageUrl    String?
  isAvailable Boolean     @default(true)
  sortOrder   Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]

  @@index([category])
  @@index([isAvailable])
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String
  email     String
  createdAt DateTime @default(now())
  orders    Order[]

  @@index([phone])
  @@index([email])
}

model Order {
  id                  String      @id @default(cuid())
  orderNumber         String      @unique
  customerId          String
  customer            Customer    @relation(fields: [customerId], references: [id])
  status              OrderStatus @default(NEW)
  subtotal            Decimal     @db.Decimal(10, 2)
  taxAmount           Decimal     @db.Decimal(10, 2)
  total               Decimal     @db.Decimal(10, 2)
  specialInstructions String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  orderItems          OrderItem[]
  payment             Payment?

  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  quantity   Int
  unitPrice  Decimal  @db.Decimal(10, 2)
  subtotal   Decimal  @db.Decimal(10, 2)

  @@index([orderId])
}

model Payment {
  id                    String        @id @default(cuid())
  orderId               String        @unique
  order                 Order         @relation(fields: [orderId], references: [id])
  stripePaymentIntentId String        @unique
  amount                Decimal       @db.Decimal(10, 2)
  status                PaymentStatus @default(PENDING)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([stripePaymentIntentId])
}

model ClientUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum OrderStatus {
  NEW
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

Run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 2: Complete File Tree

```
gabriel-restaurant/
├── .env.local
├── .env.example
├── middleware.ts                     # Protects /dashboard/*
├── next.config.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                      # Menu items + admin user
│
├── lib/
│   ├── prisma.ts                    # Singleton PrismaClient
│   ├── stripe.ts                    # Server-side Stripe client
│   ├── resend.ts                    # Resend client
│   ├── auth.ts                      # NextAuth v5 config
│   ├── tax.ts                       # TAX_RATE=0.095, calculateTax(), calculateTotal()
│   ├── order-number.ts              # generateOrderNumber() → "ORD-XXXXXXXX"
│   ├── validations.ts               # Zod schemas (customer, cart, statusUpdate)
│   └── email-templates.ts           # buildOrderConfirmationHtml()
│
├── types/
│   └── index.ts                     # OrderWithDetails, CartItemType, MenuGrouped
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── Modal.tsx
│   ├── menu/
│   │   ├── MenuBrowser.tsx          # Client component: category tabs + grid
│   │   ├── MenuItemCard.tsx         # Card with Add to Cart button
│   │   └── CategoryTabs.tsx         # Horizontal scrollable tab list
│   ├── cart/
│   │   ├── CartProvider.tsx         # Context + useReducer (ADD/REMOVE/UPDATE/CLEAR)
│   │   ├── CartDrawer.tsx           # Slide-in cart panel
│   │   ├── CartItem.tsx             # Single cart row with +/- controls
│   │   └── CartButton.tsx           # Header button showing item count badge
│   ├── checkout/
│   │   ├── CustomerInfoForm.tsx     # Name, phone, email, special instructions
│   │   ├── OrderReview.tsx          # Read-only cart summary with totals
│   │   └── StripePaymentForm.tsx    # <Elements> wrapper + confirmPayment()
│   ├── dashboard/
│   │   ├── DashboardNav.tsx         # Sidebar nav with sign-out
│   │   ├── OrdersTable.tsx          # All orders table
│   │   ├── OrderDetailModal.tsx     # Full order details + status update dropdown
│   │   ├── StatusBadge.tsx          # Color-coded status chip
│   │   └── RefreshButton.tsx        # Client: calls router.refresh()
│   └── layout/
│       ├── Header.tsx               # Logo + CartButton
│       └── Footer.tsx               # Restaurant contact info
│
└── app/
    ├── layout.tsx                   # CartProvider wraps everything
    ├── page.tsx                     # Homepage: SSR menu fetch → <MenuBrowser>
    ├── globals.css
    ├── checkout/
    │   └── page.tsx                 # Two-step: customer info form → Stripe Elements
    ├── order-success/
    │   └── page.tsx                 # Reads ?payment_intent from URL, shows receipt
    ├── dashboard/
    │   ├── layout.tsx               # Auth guard + DashboardNav
    │   ├── page.tsx                 # Active orders (NEW + IN_PROGRESS)
    │   ├── login/
    │   │   └── page.tsx             # Credentials login form
    │   └── completed/
    │       └── page.tsx             # Today's COMPLETED orders
    └── api/
        ├── menu/route.ts            # GET: items grouped by category
        ├── orders/
        │   ├── route.ts             # POST: create order + PaymentIntent; GET: staff list
        │   ├── today/route.ts       # GET: today's COMPLETED orders
        │   └── [id]/route.ts        # PATCH: update order status
        ├── webhooks/stripe/route.ts # POST: confirm payment, trigger email
        └── auth/[...nextauth]/route.ts
```

---

## Phase 3: Implementation Order (Strict Sequence)

| # | File(s) | Key logic |
|---|---|---|
| 1 | `prisma/schema.prisma` → migrate | Foundation; everything else depends on DB |
| 2 | `lib/prisma.ts`, `lib/tax.ts`, `lib/order-number.ts`, `lib/validations.ts` | Core utilities |
| 3 | `prisma/seed.ts` → `npx prisma db seed` | Populates menu for API development |
| 4 | `lib/stripe.ts`, `lib/resend.ts`, `lib/email-templates.ts` | External service clients |
| 5 | `lib/auth.ts` | NextAuth v5 Credentials config |
| 6 | `middleware.ts` | Protect /dashboard before building it |
| 7 | `app/api/auth/[...nextauth]/route.ts` | Export `{ GET, POST } = handlers` |
| 8 | `app/api/menu/route.ts` | First working API — verify DB connection |
| 9 | `app/api/orders/route.ts` (POST) | Core: validate → DB prices → Prisma tx → PaymentIntent |
| 10 | `app/api/webhooks/stripe/route.ts` | Payment confirm → update DB → email (failure non-fatal) |
| 11 | `app/api/orders/route.ts` (GET), `[id]/route.ts`, `today/route.ts` | Staff APIs |
| 12 | `components/cart/CartProvider.tsx` | Customer UI foundation |
| 13 | `components/menu/*`, `app/page.tsx` | Menu browsing homepage |
| 14 | `components/checkout/*`, `app/checkout/page.tsx` | Checkout + Stripe payment |
| 15 | `app/order-success/page.tsx` | Post-payment receipt page |
| 16 | `app/dashboard/login/page.tsx` | Staff login form |
| 17 | `components/dashboard/*`, `app/dashboard/page.tsx` | Active orders dashboard |
| 18 | `app/dashboard/completed/page.tsx` | Today's completed orders view |

---

## Phase 4: Key Implementation Patterns

### Order Creation API (`POST /api/orders`)
Critical sequence — never trust client-side prices:
1. Zod-validate request body (`orderSchema`)
2. Fetch `menuItem.price` from DB for all requested IDs
3. Reject if any item is unavailable or missing
4. Compute `subtotal` from DB prices × quantities
5. `taxAmount = round(subtotal × 0.095, 2)` ; `total = subtotal + taxAmount`
6. Prisma `$transaction`: create `Customer` → create `Order` + `OrderItem[]`
7. `stripe.paymentIntents.create({ amount: total_in_cents, currency: 'usd', metadata: { orderId } })`
8. Create `Payment` record with status `PENDING`
9. Return `{ orderId, orderNumber, clientSecret }`

### Stripe Webhook (`POST /api/webhooks/stripe`)
- Use `await req.text()` — NOT `req.json()` — to preserve raw body for signature verification
- `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` → return 400 on failure
- `payment_intent.succeeded`: update `Payment.status = SUCCEEDED`, `Order.status = NEW`, send email
- `payment_intent.payment_failed`: update `Payment.status = FAILED`
- Email failure must be caught and logged — never re-throw (webhook must return 200 to Stripe)

### Cart State (`CartProvider.tsx`)
- `useReducer` with actions: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`
- Wrap root `app/layout.tsx` so cart persists across page navigations
- Expose `useCart()` hook — throws if used outside provider

### Auth Middleware (`middleware.ts`)
```typescript
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = req.nextUrl.pathname === '/dashboard/login'
  if (isDashboard && !isLogin && !isLoggedIn)
    return NextResponse.redirect(new URL('/dashboard/login', req.url))
  if (isLogin && isLoggedIn)
    return NextResponse.redirect(new URL('/dashboard', req.url))
})
export const config = { matcher: ['/dashboard/:path*'] }
```

### Tax Calculation (`lib/tax.ts`)
```typescript
export const TAX_RATE = 0.095
export const calculateTax = (subtotal: number) =>
  Math.round(subtotal * TAX_RATE * 100) / 100
export const calculateTotal = (subtotal: number, tax: number) =>
  Math.round((subtotal + tax) * 100) / 100
```

### Email Template (`lib/email-templates.ts`)
Pure TypeScript function returning an HTML string. Includes:
- Order number and date/time
- Table: item name | qty | unit price | line total
- Subtotal, Tax (9.5%), **Total** rows
- Restaurant name, phone, address in footer
- Sent via `resend.emails.send({ from, to, subject, html })`

---

## Phase 5: Seed Data Structure

**`prisma/seed.ts`** — 13 categories, ~55 items, 1 admin user.

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Categories and representative items (**replace prices with actual Sizzling Wok values**):

| Category | Sample Items |
|---|---|
| Appetizers | Spring Rolls (2), Crab Rangoon (6), Egg Rolls (2), Dumplings (6), BBQ Spare Ribs |
| Soups | Egg Drop Soup, Wonton Soup, Hot and Sour Soup |
| Fried Rice | Chicken, Beef, Shrimp, House Special, Vegetable |
| Lo Mein | Chicken, Beef, Shrimp, Vegetable |
| Beef | Broccoli, Mongolian Beef, Snow Peas, Pepper Steak |
| Pork | Sweet & Sour Pork, Moo Shu Pork, BBQ Pork with Vegetables |
| Chicken | General Tso's, Kung Pao, Sesame, Broccoli, Moo Goo Gai Pan |
| Seafood | Shrimp Lobster Sauce, Kung Pao Shrimp, Scallops, Shrimp Broccoli |
| Vegetables | Mixed Vegetables, Tofu with Vegetables, Buddha's Delight |
| Lunch Specials | L1–L4 (with fried rice + egg roll, Mon–Fri 11am–3pm) |
| Chef's Specials | Triple Delight, Dragon and Phoenix, House Special Pan Fried Noodles |
| Desserts | Fried Ice Cream, Fortune Cookies (3), Mango Pudding |
| Drinks | Can Soda, Hot Tea, Iced Tea, Lychee Juice |

Admin user seeded: `admin@restaurant.com` / `admin123` (bcrypt hashed, cost factor 12)

---

## Phase 6: Validation Rules

| Field | Rule |
|---|---|
| Name | Required, 1–100 chars |
| Phone | Required, exactly 10 digits (`/^\d{10}$/`) |
| Email | Required, valid format |
| Items | At least 1 item in cart |
| Quantity | Positive integer |
| Special instructions | Optional, max 500 chars |

---

## Phase 7: Error Handling

| Scenario | Behavior |
|---|---|
| Zod validation failure | 400 with flattened Zod error object |
| Menu item unavailable or not found | 400 "One or more items unavailable" |
| Stripe PaymentIntent creation fails | 500, order rolled back via Prisma transaction |
| Stripe webhook signature invalid | 400, no DB changes made |
| Payment failed (`payment_intent.payment_failed`) | `Payment.status = FAILED`; order stays hidden from staff |
| Resend email failure | `console.error` logged, webhook returns 200 (order still valid) |
| Unauthenticated dashboard access | Middleware redirects to `/dashboard/login` |
| Invalid status value in PATCH | 400 "Invalid status" |

---

## Phase 8: Verification Steps

### Schema and seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio        # verify all tables + seed data in browser UI
```

### Menu API
```bash
curl http://localhost:3000/api/menu | jq '.categories | keys'
# → ["Appetizers", "Beef", "Chef's Specials", ...]
```

### Customer ordering flow (manual)
1. `npm run dev` → visit `http://localhost:3000`
2. Add items from 2+ categories → verify cart count updates in header
3. Go to checkout → fill in name, 10-digit phone, valid email
4. Stripe test card: `4242 4242 4242 4242` · exp `12/34` · CVC `123`
5. Complete payment → verify redirect to `/order-success`
6. Check email inbox (or Resend dashboard) for confirmation

### Webhook (local development)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
After placing order, verify in DB: `Payment.status = SUCCEEDED`, `Order.status = NEW`

### Staff dashboard
1. Visit `/dashboard` → should redirect to `/dashboard/login`
2. Login: `admin@restaurant.com` / `admin123`
3. Verify the order from above appears with status NEW
4. Update status: NEW → IN_PROGRESS → COMPLETED
5. Visit `/dashboard/completed` → order appears

### Auth protection
```bash
curl -I http://localhost:3000/dashboard         # 307 → /dashboard/login
curl http://localhost:3000/api/orders           # 401 Unauthorized
```

### Validation errors
- 9-digit phone → "Phone must be exactly 10 digits"
- Empty cart → checkout button disabled
- Invalid email → "Invalid email address"

---

## README Environment Variables

```
DATABASE_URL=
NEXTAUTH_SECRET=                     # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=               # from: stripe listen --print-secret
RESEND_API_KEY=
RESTAURANT_NAME=
RESTAURANT_PHONE=
RESTAURANT_ADDRESS=
RESTAURANT_EMAIL=
```

---

## Architectural Decisions

- **Order created before payment succeeds** — PaymentIntent metadata carries `orderId`; order is invisible to staff until the webhook sets `Order.status = NEW`. Staff never see unpaid orders.
- **Stripe Payment Intents (not Checkout redirect)** — keeps the customer on-page throughout payment for better UX and richer error handling.
- **`req.text()` in webhook route** — Stripe signature verification requires the raw body string; calling `req.json()` first corrupts it.
- **Email failures are non-fatal** — the order is paid and valid regardless of Resend availability. Swallowing the error ensures the webhook returns 200 to Stripe (preventing retries).
- **`Customer` ≠ `ClientUser`** — customers never authenticate; separating models avoids confusion and keeps each simpler.
- **`useReducer` for cart** — discrete actions make state transitions predictable and easy to extend (e.g., adding localStorage persistence).
