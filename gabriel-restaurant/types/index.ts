import type { Order, OrderItem, MenuItem, Customer, Payment } from '@/app/generated/prisma/client'

export type OrderWithDetails = Order & {
  customer: Customer
  orderItems: (OrderItem & { menuItem: MenuItem })[]
  payment: Payment | null
}

// Decimal-free versions safe to pass to Client Components
export type SerializableOrder = Omit<Order, 'subtotal' | 'taxAmount' | 'total'> & {
  subtotal: number
  taxAmount: number
  total: number
}

export type SerializableOrderItem = Omit<OrderItem, 'unitPrice' | 'subtotal'> & {
  unitPrice: number
  subtotal: number
  menuItem: Omit<MenuItem, 'price'> & { price: number }
}

export type SerializablePayment = Omit<Payment, 'amount'> & { amount: number }

export type SerializableOrderWithDetails = SerializableOrder & {
  customer: Customer
  orderItems: SerializableOrderItem[]
  payment: SerializablePayment | null
}

export type CartItemType = {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

// Serializable version of MenuItem safe to pass to Client Components
export type SerializableMenuItem = Omit<MenuItem, 'price' | 'createdAt' | 'updatedAt'> & {
  price: number
  createdAt: string
  updatedAt: string
}

export type MenuGrouped = {
  [category: string]: SerializableMenuItem[]
}
