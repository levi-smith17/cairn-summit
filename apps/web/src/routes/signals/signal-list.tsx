import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTerminology } from '@/contexts/terminology-context'
import type { Signal } from '@/lib/api/signals'

interface SignalListProps {
  signals: Signal[]
  selectedId: string | null
  showSnippets: boolean
  onSelect: (id: string) => void
  onDelete: (id: string, senderName: string) => void
}

export function SignalList({ signals, selectedId, showSnippets, onSelect, onDelete }: SignalListProps) {
  const { terms } = useTerminology()
  const unreadCount = signals.filter(s => !s.read).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {signals.length} {signals.length === 1 ? terms.signal.toLowerCase() : terms.signals.toLowerCase()}
          {unreadCount > 0 && (
            <span className="ml-2 text-xs text-primary">({unreadCount} unread)</span>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm px-4 text-center">
            <p>No {terms.signals.toLowerCase()} yet</p>
            <p className="text-xs">Contact-form messages from your public manifest will appear here.</p>
          </div>
        ) : (
          signals.map(signal => {
            const isSelected = selectedId === signal.id
            const preview = showSnippets ? signal.body : null
            return (
              <div
                key={signal.id}
                className={`
                  flex items-start justify-between px-4 py-3 border-b border-border/50
                  cursor-pointer transition-colors group
                  ${isSelected ? 'bg-primary/20' : 'hover:bg-muted/50'}
                  ${!signal.read ? 'font-medium' : ''}
                `}
                onClick={() => onSelect(signal.id)}
              >
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                  <div className="flex items-center gap-2">
                    {!signal.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <span className="text-sm truncate">{signal.senderName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{signal.senderEmail}</span>
                  {preview && (
                    <span className="text-xs text-muted-foreground line-clamp-2 mt-1">{preview}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(signal.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                  onClick={e => { e.stopPropagation(); onDelete(signal.id, signal.senderName) }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
