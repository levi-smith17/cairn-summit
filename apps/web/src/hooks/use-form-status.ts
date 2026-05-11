'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function useFormStatus() {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(action: () => Promise<void>) {
    setSaving(true)
    try {
      await action()
      toast.success('Saved successfully.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return { saving, saved: false, error: false, handleSubmit }
}
