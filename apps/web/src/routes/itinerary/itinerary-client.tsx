import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/studio/layout/studio-data-toolbar'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
import { luviNavLabel, type CalendarMode } from '@/lib/luvi'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { type ExternalCalendarEvent } from '@/lib/api/itinerary'

type CalendarView = 'month' | 'week' | 'day'

export type StopWithMarkers = {
  id: string
  title: string
  notes: string | null
  location: string | null
  startDate: Date
  endDate: Date | null
  allDay: boolean
  icloudCalendarId: string | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

export type CalendarOption = {
  id: string
  name: string
  color: string
}

export type ICloudEventDisplay = ExternalCalendarEvent

interface ItineraryClientProps {
  stops: StopWithMarkers[]
  calendars: CalendarOption[]
  events: ICloudEventDisplay[]
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function navigateCalendar(view: CalendarView, anchor: Date, dir: -1 | 1, mode: CalendarMode): Date {
  if (mode === 'luvi-full') {
    if (view === 'month') return addDays(anchor, dir * 26)
    if (view === 'week') return addDays(anchor, dir * 13)
    return addDays(anchor, dir)
  }
  if (view === 'month') {
    const d = new Date(anchor)
    d.setMonth(d.getMonth() + dir)
    return d
  }
  if (view === 'week') return addDays(anchor, dir * 7)
  return addDays(anchor, dir)
}

function navLabel(view: CalendarView, anchor: Date, mode: CalendarMode): string {
  if (mode === 'luvi-full') return luviNavLabel(view, anchor)
  if (view === 'month')
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  if (view === 'week') {
    const s = new Date(anchor)
    s.setDate(anchor.getDate() - anchor.getDay())
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const MODE_OPTIONS: { value: CalendarMode; label: string; short: string; tip: string }[] = [
  { value: 'gregorian', label: 'Gregorian', short: 'G',  tip: 'Standard Gregorian calendar' },
  { value: 'luvi',      label: 'Luvi',      short: 'L',  tip: 'Gregorian calendar with Luvi date overlay' },
  { value: 'luvi-full', label: 'Full Luvi', short: 'L*', tip: 'Full Luvi calendar (14 months × 26 days)' },
]

export function ItineraryClient({ stops, calendars, events }: ItineraryClientProps) {
  const { terms } = useTerminology()
  const navigate = useNavigate()
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('gregorian')
  const icloudEvents = events

  function goToday() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    setAnchor(now)
  }

  const viewLabels: Record<CalendarView, string> = {
    month: 'Month',
    week: 'Week',
    day: terms.legs.slice(0, -1),
  }

  const calendarColorMap = Object.fromEntries(calendars.map(c => [c.id, c.color]))
  const viewProps = { stops, icloudEvents, anchor, calendarMode, calendarColorMap }

  return (
    <>
      <PlatformHeader title={terms.itinerary} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={cn(STUDIO_CONTEXT_BAR_CLASS, 'gap-1.5 sm:gap-2')}>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setAnchor(d => navigateCalendar(view, d, -1, calendarMode))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>
              Today
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setAnchor(d => navigateCalendar(view, d, 1, calendarMode))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {navLabel(view, anchor, calendarMode)}
          </span>

          <div className="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-border text-xs divide-x divide-border">
            {(Object.entries(viewLabels) as [CalendarView, string][]).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-2.5 py-1 transition-colors',
                  view === v
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-border text-xs divide-x divide-border">
            {MODE_OPTIONS.map(opt => (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCalendarMode(opt.value)}
                    className={cn(
                      'px-2.5 py-1 transition-colors',
                      calendarMode === opt.value
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    )}
                  >
                    <span className="hidden sm:inline">{opt.label}</span>
                    <span className="sm:hidden">{opt.short}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{opt.tip}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate('/settings?section=itinerary')}>
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itinerary settings</TooltipContent>
          </Tooltip>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {view === 'month' && <MonthView {...viewProps} />}
          {view === 'week'  && <WeekView  {...viewProps} />}
          {view === 'day'   && <DayView   {...viewProps} />}
        </div>
      </div>
    </>
  )
}
