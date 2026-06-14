'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { CustomerInput } from '@/lib/validations'

interface CustomerInfoFormProps {
  onSubmit: (data: CustomerInput) => void
}

export function CustomerInfoForm({ onSubmit }: CustomerInfoFormProps) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', specialInstructions: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Phone must be exactly 10 digits'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address'
    if (form.specialInstructions.length > 500) errs.specialInstructions = 'Max 500 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        error={errors.name}
        placeholder="Jane Smith"
      />
      <Input
        label="Phone Number"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
        error={errors.phone}
        placeholder="8475550100"
        inputMode="numeric"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        error={errors.email}
        placeholder="jane@example.com"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Special Instructions <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={form.specialInstructions}
          onChange={(e) => setForm((f) => ({ ...f, specialInstructions: e.target.value }))}
          rows={3}
          maxLength={500}
          placeholder="Allergies, preferences, etc."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <Button type="submit" className="w-full">Continue to Payment</Button>
    </form>
  )
}
