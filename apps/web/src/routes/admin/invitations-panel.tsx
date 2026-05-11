import { useState, useTransition } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Mail, Plus, Trash2, Copy, Check, Clock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { sendInvitation, revokeInvitation } from '@/lib/api/admin'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { InvitationSummary } from '@/lib/api/admin'

export type { InvitationSummary }

function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy invite link">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function InvitationRow({
  inv,
  onRevoke,
}: {
  inv: InvitationSummary
  onRevoke: (id: string) => void
}) {
  const expired = !inv.usedAt && new Date() > new Date(inv.expiresAt)
  const used    = !!inv.usedAt

  return (
    <div className="flex items-start gap-3 py-3 px-4">
      <div className="shrink-0 mt-0.5">
        {used ? (
          <UserCheck className="h-4 w-4 text-green-500" />
        ) : expired ? (
          <Clock className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Mail className="h-4 w-4 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{inv.email}</span>
          {used && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300">Used</Badge>}
          {expired && !used && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Expired</Badge>}
          {!used && !expired && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">Pending</Badge>}
        </div>
        {inv.note && <p className="text-xs text-muted-foreground italic">{inv.note}</p>}
        <p className="text-xs text-muted-foreground">
          Sent {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
          {used ? ` · Accepted ${format(new Date(inv.usedAt!), 'MMM d, yyyy')}` : ` · Expires ${format(new Date(inv.expiresAt), 'MMM d, yyyy')}`}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {!used && !expired && inv.token && <CopyLink token={inv.token} />}
        {!used && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive/80"
            onClick={() => onRevoke(inv.id)}
            title="Revoke invitation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

interface InvitationsPanelProps {
  invitations: InvitationSummary[]
  onRefresh: () => void
}

export function InvitationsPanel({ invitations, onRefresh }: InvitationsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [sending, startSend] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revoking, startRevoke] = useTransition()

  function handleSend() {
    if (!email.trim()) return
    setError(null)
    startSend(async () => {
      const result = await sendInvitation({ email: email.trim(), note: note.trim() || undefined })
      if (result.ok) {
        setEmail('')
        setNote('')
        setShowForm(false)
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to send')
      }
    })
  }

  function handleRevoke() {
    if (!revokeId) return
    startRevoke(async () => {
      await revokeInvitation(revokeId)
      setRevokeId(null)
      onRefresh()
    })
  }

  const pending = invitations.filter(i => !i.usedAt && new Date() <= new Date(i.expiresAt))
  const used    = invitations.filter(i => !!i.usedAt)
  const expired = invitations.filter(i => !i.usedAt && new Date() > new Date(i.expiresAt))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <p className="text-sm font-medium">Invitations</p>
          <p className="text-xs text-muted-foreground">{pending.length} pending · {used.length} accepted</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowForm(v => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      {showForm && (
        <div className="border-b px-4 py-3 space-y-3 shrink-0 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Invitation</p>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-8 text-sm"
            />
            <Textarea
              placeholder="Optional note to recipient…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(null) }}>Cancel</Button>
            <Button size="sm" onClick={handleSend} disabled={sending || !email.trim()}>
              {sending ? 'Sending…' : 'Send Invite'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
            <Mail className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click Invite to send someone a link.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pending</p>
                {pending.map((inv, i) => (
                  <div key={inv.id}>
                    <InvitationRow inv={inv} onRevoke={setRevokeId} />
                    {i < pending.length - 1 && <Separator />}
                  </div>
                ))}
              </>
            )}
            {used.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Accepted</p>
                {used.map((inv, i) => (
                  <div key={inv.id}>
                    <InvitationRow inv={inv} onRevoke={setRevokeId} />
                    {i < used.length - 1 && <Separator />}
                  </div>
                ))}
              </>
            )}
            {expired.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Expired</p>
                {expired.map((inv, i) => (
                  <div key={inv.id}>
                    <InvitationRow inv={inv} onRevoke={setRevokeId} />
                    {i < expired.length - 1 && <Separator />}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!revokeId} onOpenChange={open => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The invite link will stop working immediately. The recipient will not be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revoking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
