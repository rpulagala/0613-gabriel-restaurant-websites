const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateOrderNumber(): string {
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return `ORD-${suffix}`
}
