import { Badge } from '@/components/ui/Badge'
import type { OrderStatus } from '@/app/generated/prisma/enums'

const styles: Record<OrderStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

const labels: Record<OrderStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={styles[status]}>{labels[status]}</Badge>
}
