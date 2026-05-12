import { Clock, MapPin, FileText, Lock } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { contrastColor } from '@/lib/color'

interface EventPopoverProps {
  title: string
  startDate: Date | string
  endDate: Date | string | null
  allDay: boolean
  location?: string | null
  notes?: string | null
  color: string
  readonly?: boolean
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
  children,
}: EventPopoverProps) {
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
    <Popover>
      <PopoverTrigger asChild onClick={e => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 overflow-hidden" side="bottom" align="start">
        <div
          className="px-3 py-2.5 flex items-center gap-2"
          style={{ backgroundColor: color, color: contrastColor(color) }}
        >
          {readonly && <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" />}
          <span className="text-sm font-semibold leading-snug flex-1 min-w-0">{title}</span>
        </div>

        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <div>{dateLabel}</div>
              <div>{timeLabel}</div>
            </div>
          </div>

          {location && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{location}</span>
            </div>
          )}

          {notes && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-4">{notes}</span>
            </div>
          )}

          {readonly && (
            <p className="text-[10px] text-muted-foreground/60 border-t pt-2 mt-0.5">
              Read-only — from a subscribed calendar
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
