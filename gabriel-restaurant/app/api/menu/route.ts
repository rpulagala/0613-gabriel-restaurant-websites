import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  const categories = items.reduce<Record<string, object[]>>((acc, item) => {
    const serialized = {
      ...item,
      price: Number(item.price),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(serialized)
    return acc
  }, {})

  return Response.json({ categories })
}
