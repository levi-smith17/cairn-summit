import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/studio/layout/studio-data-toolbar'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'
import { luviNavLabel, type CalendarMode } from '@/lib/luvi'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { type CalendarSyncStatus, type ExternalCalendarEvent } from '@/lib/api/itinerary'

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
  calendarSync?: CalendarSyncStatus[]
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

export function ItineraryClient({
  stops,
  calendars,
  events,
  calendarSync = [],
}: ItineraryClientProps) {
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
  const syncProblems = calendarSync.filter((s) => s.status !== 'ok')
  const showEmptyHint =
    events.length === 0 && (calendars.length > 0 || calendarSync.length > 0)

  return (
    <>
      <PlatformStudioContextBar
        aria-label={`${terms.itinerary} header`}
        title={terms.itinerary}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('/settings?section=itinerary')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itinerary settings</TooltipContent>
          </Tooltip>
        }
      />

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
        </div>

        {syncProblems.length > 0 ? (
          <div className="flex shrink-0 items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-950 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 space-y-0.5">
              {syncProblems.map((s) => (
                <p key={s.calendarId}>
                  <span className="font-medium">{s.name}</span>
                  {': '}
                  {s.message ??
                    (s.status === 'auth_failed'
                      ? 'Authentication failed — check your iCloud app password in Settings.'
                      : s.status === 'not_found'
                        ? 'Calendar not found on the remote account.'
                        : 'Could not sync events.')}
                </p>
              ))}
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                onClick={() => navigate('/settings?section=itinerary')}
              >
                Open Itinerary settings
              </button>
            </div>
          </div>
        ) : null}

        {showEmptyHint && syncProblems.length === 0 ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            Connected calendars returned no events in this range. Confirm sync is enabled in Settings.
          </div>
        ) : null}

        {calendars.length === 0 && calendarSync.length === 0 ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            No calendars connected yet.{' '}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => navigate('/settings?section=itinerary')}
            >
              Connect a calendar
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {view === 'month' && <MonthView {...viewProps} />}
          {view === 'week'  && <WeekView  {...viewProps} />}
          {view === 'day'   && <DayView   {...viewProps} />}
        </div>
      </div>
    </>
  )
}
