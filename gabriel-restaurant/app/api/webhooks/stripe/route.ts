import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { buildOrderConfirmationHtml } from '@/lib/email-templates'
import type { OrderWithDetails } from '@/types'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const { orderId } = intent.metadata

    await prisma.$transaction([
      prisma.payment.update({
        where: { stripePaymentIntentId: intent.id },
        data: { status: 'SUCCEEDED' },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'NEW' },
      }),
    ])

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: { include: { menuItem: true } },
        payment: true,
      },
    })

    if (order) {
      try {
        await resend.emails.send({
          from: `${process.env.RESTAURANT_NAME} <noreply@${process.env.RESTAURANT_EMAIL?.split('@')[1] ?? 'restaurant.com'}>`,
          to: order.customer.email,
          subject: `Order Confirmation – ${order.orderNumber}`,
          html: buildOrderConfirmationHtml(order as OrderWithDetails),
        })
      } catch (err) {
        console.error('Failed to send confirmation email:', err)
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object
    await prisma.payment.update({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'FAILED' },
    })
  }

  return new Response('OK', { status: 200 })
}
