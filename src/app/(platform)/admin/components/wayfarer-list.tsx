'use client'

import { format } from 'date-fns'
import { Eye, EyeOff, Plus, Shield, Trash2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

export interface WayfarerSummary {
  id: string
  name: string | null
  email: string | null
  username: string | null
  customDomain: string | null
  isAdmin: boolean
  listed: boolean
  createdAt: Date
}

interface WayfarerListProps {
  wayfarers: WayfarerSummary[]
  selectedId: string | null
  currentUserId: string
  selectedBulk: Set<string>
  bulking: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onToggleBulk: (id: string) => void
  onToggleAllBulk: () => void
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
  onNew,
  onToggleBulk,
  onToggleAllBulk,
  onBulkMarkListed,
  onBulkDelete,
  onBulkClear,
}: WayfarerListProps) {
  const allSelected = wayfarers.length > 0 && wayfarers.every(w => selectedBulk.has(w.id))
  const someSelected = selectedBulk.size > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAllBulk}
            aria-label="Select all"
            className="shrink-0"
          />
          <span className="text-sm font-medium">
            {`${wayfarers.length} wayfarer${wayfarers.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add wayfarer</TooltipContent>
        </Tooltip>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/80 border-b shrink-0">
          <span className="text-xs text-muted-foreground mr-1">{selectedBulk.size} selected</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" disabled={bulking}
            onClick={() => onBulkMarkListed(true)}>
            <Eye className="h-3 w-3" />Listed
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" disabled={bulking}
            onClick={() => onBulkMarkListed(false)}>
            <EyeOff className="h-3 w-3" />Unlisted
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive/80"
            disabled={bulking} onClick={onBulkDelete}>
            <Trash2 className="h-3 w-3" />Delete
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onBulkClear}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {wayfarers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <p className="text-sm text-muted-foreground">No wayfarers found.</p>
          </div>
        ) : (
          wayfarers.map((w, i) => (
            <div key={w.id}>
              <div
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                  selectedId === w.id ? 'bg-primary/10 hover:bg-primary/10' : ''
                }`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={selectedBulk.has(w.id)}
                  onCheckedChange={() => onToggleBulk(w.id)}
                  onClick={e => e.stopPropagation()}
                  aria-label={`Select ${w.name ?? w.email}`}
                  className="shrink-0"
                />

                {/* Row — click to select for edit */}
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelect(w.id)}
                >
                  {/* Avatar initial */}
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground uppercase">
                    {(w.name?.[0] ?? w.email?.[0] ?? '?')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">
                        {w.name ?? w.email ?? '(no name)'}
                      </p>
                      {w.isAdmin && <Shield className="h-3 w-3 text-primary shrink-0" />}
                      {!w.listed && <UserX className="h-3 w-3 text-muted-foreground shrink-0" />}
                      {w.id === currentUserId && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none">you</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {w.email}
                      {w.username && <span className="ml-1.5 opacity-60">@{w.username}</span>}
                    </p>
                  </div>

                  {/* Join date */}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(w.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              {i < wayfarers.length - 1 && <Separator />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
