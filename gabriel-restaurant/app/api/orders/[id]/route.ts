import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { statusUpdateSchema } from '@/lib/validations'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const result = statusUpdateSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: result.data.status },
  })

  return Response.json({ order })
}
