export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { MenuBrowser } from '@/components/menu/MenuBrowser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import type { MenuGrouped, SerializableMenuItem } from '@/types'

async function getMenu(): Promise<MenuGrouped> {
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  return items.reduce<MenuGrouped>((acc, item) => {
    const serializable: SerializableMenuItem = {
      ...item,
      price: Number(item.price),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(serializable)
    return acc
  }, {})
}

export default async function HomePage() {
  const categories = await getMenu()

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Sizzling Wok'}
        </h1>
        <p className="mb-6 text-gray-500">Order online for pickup</p>
        <MenuBrowser categories={categories} />
      </main>
      <Footer />
    </>
  )
}
