import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFormStatus } from '@/hooks/use-form-status'
import { markSignalRead, replyToSignal } from '@/lib/api/signals'
import type { Signal } from '@/lib/api/signals'

interface SignalDetailProps {
  signal: Signal
  autoMarkRead: boolean
}

export function SignalDetail({ signal, autoMarkRead }: SignalDetailProps) {
  const queryClient = useQueryClient()
  const { saving, handleSubmit } = useFormStatus()
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (!autoMarkRead || signal.read) return
    markSignalRead(signal.id)
      .then(() => queryClient.invalidateQueries({ queryKey: ['signals'] }))
      .then(() => queryClient.invalidateQueries({ queryKey: ['profile'] }))
      .catch(() => {})
  }, [signal.id, signal.read, autoMarkRead, queryClient])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    await handleSubmit(async () => {
      await replyToSignal(signal.id, reply.trim())
      setReply('')
      queryClient.invalidateQueries({ queryKey: ['signals'] })
    })
  }

  const thread = [
    {
      id: 'initial',
      body: signal.body,
      direction: 'INBOUND' as const,
      senderName: signal.senderName,
      createdAt: signal.createdAt,
    },
    ...signal.replies,
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-medium">{signal.senderName}</h2>
        <p className="text-xs text-muted-foreground">{signal.senderEmail}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {thread.map(message => {
          const isOutbound = message.direction === 'OUTBOUND'
          return (
            <div
              key={message.id}
              className={`flex flex-col gap-1 max-w-[85%] ${isOutbound ? 'items-end self-end' : 'items-start'}`}
            >
              <span className="text-xs text-muted-foreground px-1">
                {isOutbound ? 'You' : message.senderName}
              </span>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  isOutbound
                    ? 'rounded-tr-none bg-primary text-primary-foreground'
                    : 'rounded-tl-none bg-muted'
                }`}
              >
                {message.body}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">
                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )
        })}
      </div>

      <form onSubmit={onSubmit} className="p-4 border-t shrink-0 flex flex-col gap-2">
        <Textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !reply.trim()}>
            {saving ? 'Sending…' : 'Send reply'}
          </Button>
        </div>
      </form>
    </div>
  )
}
