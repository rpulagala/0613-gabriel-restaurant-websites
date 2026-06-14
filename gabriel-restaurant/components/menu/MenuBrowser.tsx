'use client'

import { useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { MenuItemCard } from './MenuItemCard'
import type { MenuGrouped } from '@/types'

export function MenuBrowser({ categories }: { categories: MenuGrouped }) {
  const categoryNames = Object.keys(categories)
  const [active, setActive] = useState(categoryNames[0] ?? '')

  return (
    <div className="space-y-4">
      <CategoryTabs categories={categoryNames} active={active} onSelect={setActive} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(categories[active] ?? []).map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
