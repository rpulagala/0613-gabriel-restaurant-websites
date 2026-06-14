import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const paymentIntentId = request.nextUrl.searchParams.get('payment_intent')
  if (!paymentIntentId) {
    return Response.json({ error: 'Missing payment_intent' }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { order: { select: { orderNumber: true } } },
  })

  if (!payment) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ orderNumber: payment.order.orderNumber })
}
