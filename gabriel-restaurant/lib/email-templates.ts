import type { OrderWithDetails } from '@/types'
import { format } from 'date-fns'

export function buildOrderConfirmationHtml(order: OrderWithDetails): string {
  const restaurantName = process.env.RESTAURANT_NAME ?? 'Sizzling Wok'
  const restaurantPhone = process.env.RESTAURANT_PHONE ?? ''
  const restaurantAddress = process.env.RESTAURANT_ADDRESS ?? ''

  const rows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.menuItem.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(item.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#b91c1c">${restaurantName}</h1>
  <h2>Order Confirmation</h2>
  <p><strong>Order #:</strong> ${order.orderNumber}</p>
  <p><strong>Date:</strong> ${format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}</p>
  <p><strong>Name:</strong> ${order.customer.name}</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:8px;text-align:left">Item</th>
        <th style="padding:8px;text-align:center">Qty</th>
        <th style="padding:8px;text-align:right">Unit Price</th>
        <th style="padding:8px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="padding:8px;text-align:right"><strong>Subtotal</strong></td>
        <td style="padding:8px;text-align:right">$${Number(order.subtotal).toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:8px;text-align:right">Tax (9.5%)</td>
        <td style="padding:8px;text-align:right">$${Number(order.taxAmount).toFixed(2)}</td>
      </tr>
      <tr style="font-size:1.1em">
        <td colspan="3" style="padding:8px;text-align:right"><strong>Total</strong></td>
        <td style="padding:8px;text-align:right"><strong>$${Number(order.total).toFixed(2)}</strong></td>
      </tr>
    </tfoot>
  </table>

  ${order.specialInstructions ? `<p style="margin-top:16px"><strong>Special instructions:</strong> ${order.specialInstructions}</p>` : ''}

  <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
  <p style="color:#6b7280;font-size:0.9em">
    ${restaurantName}<br/>
    ${restaurantPhone}<br/>
    ${restaurantAddress}
  </p>
</body>
</html>`
}
