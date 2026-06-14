'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Mobile: bottom sheet. Desktop: centered dialog. */}
      <div className="relative z-10 w-full rounded-t-2xl bg-white p-6 shadow-xl max-h-[90dvh] overflow-y-auto sm:max-w-lg sm:rounded-xl">
        {/* Drag handle hint on mobile */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
