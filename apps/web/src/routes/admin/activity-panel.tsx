import { formatDistanceToNow } from 'date-fns'
import {
  UserPlus, UserMinus, UserCog, Mail, MailX, Eye, EyeOff, Users, Trash2,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import type { ActivityEntry } from '@/lib/api/admin'

export type { ActivityEntry }

const ACTION_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  'wayfarer.created':      { label: 'Created wayfarer',       Icon: UserPlus,  color: 'text-green-500' },
  'wayfarer.updated':      { label: 'Updated wayfarer',       Icon: UserCog,   color: 'text-blue-500' },
  'wayfarer.deleted':      { label: 'Deleted wayfarer',       Icon: UserMinus, color: 'text-destructive' },
  'wayfarer.bulk_updated': { label: 'Bulk updated wayfarers', Icon: Users,     color: 'text-blue-500' },
  'wayfarer.bulk_deleted': { label: 'Bulk deleted wayfarers', Icon: Trash2,    color: 'text-destructive' },
  'invitation.sent':       { label: 'Sent invitation',        Icon: Mail,      color: 'text-primary' },
  'invitation.revoked':    { label: 'Revoked invitation',     Icon: MailX,     color: 'text-amber-500' },
  'impersonation.started': { label: 'Started impersonation',  Icon: Eye,       color: 'text-amber-500' },
  'impersonation.stopped': { label: 'Stopped impersonation',  Icon: EyeOff,    color: 'text-muted-foreground' },
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    Icon: UserCog,
    color: 'text-muted-foreground',
  }
  const { Icon, color } = meta
  const target = entry.targetEmail ?? entry.targetId

  return (
    <div className="flex items-start gap-3 py-3 px-4">
      <div className={`shrink-0 mt-0.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm">
          <span className="font-medium">{entry.admin.name ?? entry.admin.email}</span>
          {' '}
          <span className="text-muted-foreground">{meta.label}</span>
          {target && (
            <span className="text-muted-foreground"> · {target}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

interface ActivityPanelProps {
  activities: ActivityEntry[]
}

export function ActivityPanel({ activities }: ActivityPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-sm font-medium">Activity Log</p>
        <p className="text-xs text-muted-foreground">{activities.length} recent admin actions</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No admin activity yet.</p>
          </div>
        ) : (
          activities.map((entry, i) => (
            <div key={entry.id}>
              <ActivityRow entry={entry} />
              {i < activities.length - 1 && <Separator />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
