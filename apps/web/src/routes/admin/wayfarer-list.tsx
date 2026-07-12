import { format } from 'date-fns'
import { Eye, EyeOff, Shield, Trash2, UserX } from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { WayfarerSummary } from '@/lib/api/admin'

export type { WayfarerSummary }

interface WayfarerListProps {
  wayfarers: WayfarerSummary[]
  selectedId: string | null
  currentUserId: string
  selectedBulk: Set<string>
  bulking: boolean
  onSelect: (id: string) => void
  onToggleBulk: (id: string) => void
  onBulkMarkListed: (listed: boolean) => void
  onBulkDelete: () => void
  onBulkClear: () => void
}

export function WayfarerList({
  wayfarers,
  selectedId,
  currentUserId,
  selectedBulk,
  bulking,
  onSelect,
  onToggleBulk,
  onBulkMarkListed,
  onBulkDelete,
  onBulkClear,
}: WayfarerListProps) {
  const { terms } = useTerminology()
  const someSelected = selectedBulk.size > 0

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {someSelected ? (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-muted/80 px-3 py-2">
          <span className="mr-1 text-xs text-muted-foreground">{selectedBulk.size} selected</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={bulking}
            onClick={() => onBulkMarkListed(true)}
          >
            <Eye className="h-3 w-3" />
            Listed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={bulking}
            onClick={() => onBulkMarkListed(false)}
          >
            <EyeOff className="h-3 w-3" />
            Unlisted
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive/80"
            disabled={bulking}
            onClick={onBulkDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={onBulkClear}>
            Cancel
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {wayfarers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">No {terms.wayfarers.toLowerCase()} found.</p>
          </div>
        ) : (
          wayfarers.map((w, i) => (
            <div key={w.id}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 ${
                  selectedId === w.id ? 'bg-primary/10 hover:bg-primary/10' : ''
                }`}
              >
                <Checkbox
                  checked={selectedBulk.has(w.id)}
                  onCheckedChange={() => onToggleBulk(w.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${w.name ?? w.email}`}
                  className="shrink-0"
                />

                <div
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  onClick={() => onSelect(w.id)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                    {w.name?.[0] ?? w.email?.[0] ?? '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {w.name ?? w.email ?? '(no name)'}
                      </p>
                      {w.isAdmin ? <Shield className="h-3 w-3 shrink-0 text-primary" /> : null}
                      {!w.listed ? <UserX className="h-3 w-3 shrink-0 text-muted-foreground" /> : null}
                      {w.id === currentUserId ? (
                        <Badge variant="outline" className="h-4 px-1 py-0 text-[10px] leading-none">
                          you
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.email}
                      {w.username ? <span className="ml-1.5 opacity-60">@{w.username}</span> : null}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {format(new Date(w.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              {i < wayfarers.length - 1 ? <Separator /> : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
