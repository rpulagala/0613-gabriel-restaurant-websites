'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from './StatusBadge'
import type { SerializableOrderWithDetails } from '@/types'
import type { OrderStatus } from '@/app/generated/prisma/enums'
import { format } from 'date-fns'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
}

interface OrderDetailModalProps {
  order: SerializableOrderWithDetails | null
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!order) return null

  const nextStatus = NEXT_STATUS[order.status as OrderStatus]

  async function advanceStatus() {
    if (!nextStatus || !order) return
    setError(null)

    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (!res.ok) {
      setError('Failed to update status')
      return
    }

    startTransition(() => {
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal open={!!order} onClose={onClose} title={`Order ${order.orderNumber}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <StatusBadge status={order.status as OrderStatus} />
          <span className="text-gray-500">{format(new Date(order.createdAt), 'MMM d, h:mm a')}</span>
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-900">{order.customer.name}</p>
          <p className="text-gray-600">{order.customer.phone}</p>
          <p className="text-gray-600">{order.customer.email}</p>
        </div>

        <div className="divide-y">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span className="text-gray-700">{item.menuItem.name} × {item.quantity}</span>
              <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t pt-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (9.5%)</span>
            <span>${Number(order.taxAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {order.specialInstructions && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm">
            <p className="font-medium text-yellow-800">Special Instructions</p>
            <p className="text-yellow-700">{order.specialInstructions}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {nextStatus && (
          <Button onClick={advanceStatus} loading={isPending} className="w-full">
            Mark as {nextStatus === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
          </Button>
        )}
      </div>
    </Modal>
  )
}
