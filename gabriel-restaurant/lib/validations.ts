import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  email: z.string().email(),
  specialInstructions: z.string().max(500).optional(),
})

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
})

export const orderSchema = z.object({
  customer: customerSchema,
  items: z.array(cartItemSchema).min(1, 'Cart must have at least one item'),
})

export const statusUpdateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type OrderInput = z.infer<typeof orderSchema>
