'use client'

import { useState, useEffect } from 'react'

export function useFormStatus() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [saved])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  async function handleSubmit(action: () => Promise<void>) {
    setSaving(true)
    setSaved(false)
    setError(false)
    try {
      await action()
      setSaved(true)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return { saving, saved, error, handleSubmit }
}