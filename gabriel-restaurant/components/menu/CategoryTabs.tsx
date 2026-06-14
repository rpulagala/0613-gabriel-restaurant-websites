'use client'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onSelect: (category: string) => void
}

export function CategoryTabs({ categories, active, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            active === cat
              ? 'bg-red-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
