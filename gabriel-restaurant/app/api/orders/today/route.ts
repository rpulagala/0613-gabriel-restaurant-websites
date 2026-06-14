import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    include: {
      customer: true,
      orderItems: { include: { menuItem: true } },
      payment: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({ orders })
}
