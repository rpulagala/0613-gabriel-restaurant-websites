import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { orderSchema } from '@/lib/validations'
import { calculateTax, calculateTotal } from '@/lib/tax'
import { generateOrderNumber } from '@/lib/order-number'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json()
  const result = orderSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { customer, items } = result.data

  // Fetch prices from DB — never trust client
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) } },
  })

  if (menuItems.length !== items.length) {
    return Response.json({ error: 'One or more items unavailable' }, { status: 400 })
  }
  if (menuItems.some((m) => !m.isAvailable)) {
    return Response.json({ error: 'One or more items unavailable' }, { status: 400 })
  }

  const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]))
  let rawSubtotal = 0
  const lineItems = items.map((item) => {
    const unitPrice = priceMap.get(item.menuItemId)!
    const lineSubtotal = Math.round(unitPrice * item.quantity * 100) / 100
    rawSubtotal += lineSubtotal
    return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice, subtotal: lineSubtotal }
  })
  const subtotal = Math.round(rawSubtotal * 100) / 100
  const taxAmount = calculateTax(subtotal)
  const total = calculateTotal(subtotal, taxAmount)
  const orderNumber = generateOrderNumber()

  // Step 1: Create Customer + Order + OrderItems in a transaction
  let orderId: string
  try {
    const order = await prisma.$transaction(async (tx) => {
      const dbCustomer = await tx.customer.create({
        data: { name: customer.name, phone: customer.phone, email: customer.email },
      })
      return tx.order.create({
        data: {
          orderNumber,
          customerId: dbCustomer.id,
          subtotal,
          taxAmount,
          total,
          specialInstructions: customer.specialInstructions,
          orderItems: {
            create: lineItems.map((li) => ({
              menuItemId: li.menuItemId,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              subtotal: li.subtotal,
            })),
          },
        },
      })
    })
    orderId = order.id
  } catch {
    return Response.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // TESTING: skip Stripe — mark order NEW immediately so it appears on the dashboard
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'NEW' } }),
    prisma.payment.create({
      data: { orderId, stripePaymentIntentId: `test_${orderId}`, amount: total, status: 'SUCCEEDED' },
    }),
  ])

  // Step 2: Create Stripe PaymentIntent
  // let clientSecret: string
  // try {
  //   const paymentIntent = await stripe.paymentIntents.create({
  //     amount: Math.round(total * 100),
  //     currency: 'usd',
  //     metadata: { orderId, orderNumber },
  //   })
  //   clientSecret = paymentIntent.client_secret!
  //
  //   // Step 3: Record Payment with PENDING status
  //   await prisma.payment.create({
  //     data: {
  //       orderId,
  //       stripePaymentIntentId: paymentIntent.id,
  //       amount: total,
  //       status: 'PENDING',
  //     },
  //   })
  // } catch {
  //   // Stripe failed — delete the orphaned order
  //   await prisma.order.delete({ where: { id: orderId } }).catch(() => {})
  //   return Response.json({ error: 'Failed to initialize payment' }, { status: 500 })
  // }

  return Response.json({ orderId, orderNumber })
}

export async function GET() {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
    include: {
      customer: true,
      orderItems: { include: { menuItem: true } },
      payment: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({ orders })
}
