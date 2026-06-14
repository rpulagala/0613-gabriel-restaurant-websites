'use client'

import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { OrderDetailModal } from './OrderDetailModal'
import type { SerializableOrderWithDetails } from '@/types'
import type { OrderStatus } from '@/app/generated/prisma/enums'
import { format } from 'date-fns'

export function OrdersTable({ orders }: { orders: SerializableOrderWithDetails[] }) {
  const [selected, setSelected] = useState<SerializableOrderWithDetails | null>(null)

  if (orders.length === 0) {
    return <p className="py-12 text-center text-gray-500">No orders yet.</p>
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Order #', 'Time', 'Customer', 'Items', 'Total', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelected(order)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(order.createdAt), 'h:mm a')}</td>
                <td className="px-4 py-3 text-gray-900">{order.customer.name}</td>
                <td className="px-4 py-3 text-gray-600">{order.orderItems.reduce((s, i) => s + i.quantity, 0)} items</td>
                <td className="px-4 py-3 font-medium text-gray-900">${Number(order.total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </>
  )
}
