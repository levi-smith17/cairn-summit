'use client'

import { useState } from 'react'
import { Lock, Clock, MapPin, FileText, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { contrastColor } from '@/lib/color'

interface EventPopoverProps {
  title: string
  startDate: Date | string
  endDate: Date | string | null
  allDay: boolean
  location?: string | null
  notes?: string | null
  color: string
  /** True for subscription-calendar events — hides edit/delete */
  readonly?: boolean
  onEdit?: () => void
  onDelete?: () => void
  children: React.ReactNode
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function EventPopover({
  title,
  startDate: startRaw,
  endDate: endRaw,
  allDay,
  location,
  notes,
  color,
  readonly,
  onEdit,
  onDelete,
  children,
}: EventPopoverProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const startDate = startRaw instanceof Date ? startRaw : new Date(startRaw)
  const endDate = endRaw ? (endRaw instanceof Date ? endRaw : new Date(endRaw)) : null

  const timeLabel = allDay
    ? 'All day'
    : endDate
      ? `${formatTime(startDate)} – ${formatTime(endDate)}`
      : formatTime(startDate)

  const dateLabel = allDay && endDate && !isSameDay(startDate, endDate)
    ? `${formatDate(startDate)} – ${formatDate(endDate)}`
    : formatDate(startDate)

  return (
    <Popover onOpenChange={open => { if (!open) setConfirmingDelete(false) }}>
      <PopoverTrigger asChild onClick={e => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 overflow-hidden" side="bottom" align="start">
        {/* Color header */}
        <div
          className="px-3 py-2.5 flex items-center gap-2"
          style={{ backgroundColor: color, color: contrastColor(color) }}
        >
          {readonly && <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" />}
          <span className="text-sm font-semibold leading-snug flex-1 min-w-0">{title}</span>
        </div>

        {confirmingDelete ? (
          <div className="p-3 flex flex-col gap-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
              <span>Are you sure you want to remove this event? This cannot be undone.</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={e => { e.stopPropagation(); setConfirmingDelete(false) }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 h-7 text-xs gap-1.5"
                onClick={e => { e.stopPropagation(); onDelete?.() }}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {/* Date + time */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <div>{dateLabel}</div>
                <div>{timeLabel}</div>
              </div>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{location}</span>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-4">{notes}</span>
              </div>
            )}

            {/* Actions */}
            {!readonly && (onEdit || onDelete) && (
              <div className="flex items-center gap-2 pt-1 border-t mt-0.5">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1.5"
                    onClick={e => { e.stopPropagation(); onEdit() }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                    onClick={e => { e.stopPropagation(); setConfirmingDelete(true) }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                )}
              </div>
            )}

            {readonly && (
              <p className="text-[10px] text-muted-foreground/60 border-t pt-2 mt-0.5">
                Read-only — from a subscribed calendar
              </p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
