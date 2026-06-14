export const TAX_RATE = 0.095

export const calculateTax = (subtotal: number) =>
  Math.round(subtotal * TAX_RATE * 100) / 100

export const calculateTotal = (subtotal: number, tax: number) =>
  Math.round((subtotal + tax) * 100) / 100
