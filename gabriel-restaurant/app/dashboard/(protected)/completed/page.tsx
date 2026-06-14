export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { OrdersTable } from '@/components/dashboard/OrdersTable'
import { RefreshButton } from '@/components/dashboard/RefreshButton'
import { startOfDay, endOfDay } from 'date-fns'
import type { OrderWithDetails, SerializableOrderWithDetails } from '@/types'

function serializeOrder(order: OrderWithDetails): SerializableOrderWithDetails {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    total: Number(order.total),
    orderItems: order.orderItems.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      menuItem: { ...item.menuItem, price: Number(item.menuItem.price) },
    })),
    payment: order.payment
      ? { ...order.payment, amount: Number(order.payment.amount) }
      : null,
  }
}

async function getTodayCompleted(): Promise<SerializableOrderWithDetails[]> {
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
  }) as OrderWithDetails[]
  return orders.map(serializeOrder)
}

export default async function CompletedPage() {
  const orders = await getTodayCompleted()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Completed Orders</h1>
        <RefreshButton />
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
