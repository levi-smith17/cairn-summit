import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface ContactContentProps {
  username: string
  wayfarerName: string | null
}

export function ContactContent({ username, wayfarerName }: ContactContentProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    if (data.get('honeypot')) return // bot trap

    setPending(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/signals/contact/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: data.get('senderName'),
          senderEmail: data.get('senderEmail'),
          body: data.get('body'),
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle className="h-10 w-10 text-header" />
        <div>
          <p className="font-medium">Message sent</p>
          <p className="text-sm text-muted-foreground mt-1">
            {wayfarerName ?? 'They'} will be in touch soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Honeypot — hidden from real users, bots fill it */}
      <input name="honeypot" type="text" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold shrink-0">Your details</h2>
          <Separator className="flex-1 bg-header" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="senderName">Name</Label>
            <Input id="senderName" name="senderName" placeholder="Your name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senderEmail">Email</Label>
            <Input id="senderEmail" name="senderEmail" type="email" placeholder="your@email.com" required />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold shrink-0">Message</h2>
          <Separator className="flex-1 bg-header" />
        </div>
        <Textarea id="body" name="body" placeholder={`Write your message to ${wayfarerName ?? 'them'}...`} rows={6} required maxLength={2000} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  )
}
