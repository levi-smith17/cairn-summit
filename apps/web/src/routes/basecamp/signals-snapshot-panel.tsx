import { Link } from 'react-router-dom'
import { Mail, ChevronRight } from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'

interface SignalMessage {
  id: string
  senderName: string
  body: string
  createdAt: string
  read: boolean
}

interface SignalsSnapshotPanelProps {
  unreadCount: number
  latestMessages: SignalMessage[]
}

export function SignalsSnapshotPanel({ unreadCount, latestMessages }: SignalsSnapshotPanelProps) {
  const { terms } = useTerminology()

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.signals}</span>
        {unreadCount > 0 && (
          <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <Link
          to="/signals"
          className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {latestMessages.length === 0 ? (
        <p className="text-xs text-muted-foreground px-4 py-3">No messages yet.</p>
      ) : (
        <div className="divide-y">
          {latestMessages.map(message => (
            <Link
              key={message.id}
              to="/signals"
              className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium truncate ${message.read ? 'text-muted-foreground' : ''}`}>
                  {message.senderName}
                </span>
                {!message.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
              </div>
              <span className="text-xs text-muted-foreground truncate">{message.body}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
