'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { useTerminology } from '@/contexts/terminology-context'
import { luviNavLabel, type CalendarMode } from '@/lib/luvi'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { StopForm } from './stop-form'
import { RecurrenceDialog, type RecurrenceScope } from './recurrence-dialog'
import {
  fetchExternalCalendarEvents,
  deleteStop as deleteStopAction,
  deleteStopOccurrence,
  deleteICloudEventDirect,
  type ExternalCalendarEvent,
} from '@/actions/itinerary'

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
  recurrenceRule: string | null
  masterStopId: string | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

export type MarkerOption = {
  id: string
  name: string
  color: string
  icon: string | null
}

export type CalendarOption = {
  id: string
  name: string
  color: string
}

// Re-export for page.tsx and view components
export type ICloudEventDisplay = ExternalCalendarEvent

// Virtual recurring occurrence — id format: "${masterId}::${isoDate}"
export function isVirtualRecurring(stop: StopWithMarkers): boolean {
  return stop.id.includes('::')
}
export function getMasterId(stop: StopWithMarkers): string {
  return stop.id.includes('::') ? stop.id.split('::')[0] : stop.id
}
export function getInstanceDate(stop: StopWithMarkers): Date {
  return new Date(stop.id.split('::')[1])
}

interface ItineraryClientProps {
  stops: StopWithMarkers[]
  markers: MarkerOption[]
  calendars: CalendarOption[]
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function navigate(view: CalendarView, anchor: Date, dir: -1 | 1, mode: CalendarMode): Date {
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

export function ItineraryClient({ stops, markers, calendars }: ItineraryClientProps) {
  const { terms } = useTerminology()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('gregorian')
  const [selectedStop, setSelectedStop] = useState<StopWithMarkers | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formInitialDate, setFormInitialDate] = useState<Date | null>(null)
  const [formICloudSeed, setFormICloudSeed] = useState<ICloudEventDisplay | null>(null)
  const [formOccurrenceDate, setFormOccurrenceDate] = useState<Date | null>(null)
  const [formOccurrenceScope, setFormOccurrenceScope] = useState<RecurrenceScope | null>(null)
  const [formMasterId, setFormMasterId] = useState<string | null>(null)

  // Recurrence dialog — used for both Cairn stops and recurring iCloud events
  const [recurrenceDialog, setRecurrenceDialog] = useState<{
    stop: StopWithMarkers
    mode: 'edit' | 'delete'
  } | null>(null)
  const [icloudRecurrenceDialog, setICloudRecurrenceDialog] = useState<ICloudEventDisplay | null>(null)

  // External calendar events — loaded after mount so the page renders immediately
  const [icloudEvents, setIcloudEvents] = useState<ICloudEventDisplay[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    fetchExternalCalendarEvents()
      .then(events => {
        // Rehydrate Date objects (server actions serialize dates as strings)
        setIcloudEvents(events.map(e => ({
          ...e,
          startDate: new Date(e.startDate),
          endDate: e.endDate ? new Date(e.endDate) : null,
        })))
      })
      .finally(() => setEventsLoading(false))
  }, [])

  function openNew(date?: Date) {
    setSelectedStop(null)
    setFormICloudSeed(null)
    setFormInitialDate(date ?? anchor)
    setFormOccurrenceDate(null)
    setFormOccurrenceScope(null)
    setFormMasterId(null)
    setShowForm(true)
  }

  function openEdit(stop: StopWithMarkers) {
    // If it's a virtual recurring occurrence or a master with recurrence, show dialog
    if (isVirtualRecurring(stop) || (stop.recurrenceRule && !stop.masterStopId)) {
      setRecurrenceDialog({ stop, mode: 'edit' })
      return
    }
    // Non-recurring or already-an-exception → open form directly
    _openForm(stop, null, null, null)
  }

  function openDelete(stop: StopWithMarkers) {
    if (isVirtualRecurring(stop) || (stop.recurrenceRule && !stop.masterStopId)) {
      setRecurrenceDialog({ stop, mode: 'delete' })
      return
    }
    // Non-recurring: delete directly
    startTransition(async () => {
      await deleteStopAction(stop.id)
      router.refresh()
    })
  }

  function _openForm(
    stop: StopWithMarkers | null,
    occurrenceDate: Date | null,
    scope: RecurrenceScope | null,
    masterId: string | null,
  ) {
    // For virtual occurrences, find the master stop to use as the base
    if (stop && isVirtualRecurring(stop)) {
      const mId = getMasterId(stop)
      const master = stops.find(s => s.id === mId) ?? stop
      setSelectedStop(scope === 'all' ? master : stop)
    } else {
      setSelectedStop(stop)
    }
    setFormOccurrenceDate(occurrenceDate)
    setFormOccurrenceScope(scope)
    setFormMasterId(masterId)
    setFormICloudSeed(null)
    setFormInitialDate(null)
    setShowForm(true)
  }

  function handleRecurrenceSelect(scope: RecurrenceScope) {
    if (!recurrenceDialog) return
    const { stop, mode } = recurrenceDialog
    setRecurrenceDialog(null)

    const virtual = isVirtualRecurring(stop)
    const instanceDate = virtual ? getInstanceDate(stop) : new Date(stop.startDate)
    const masterId = virtual ? getMasterId(stop) : stop.id

    if (mode === 'delete') {
      startTransition(async () => {
        await deleteStopOccurrence({ masterId, occurrenceDate: instanceDate, scope })
        router.refresh()
      })
    } else {
      if (scope === 'all') {
        const master = stops.find(s => s.id === masterId) ?? stop
        _openForm(master, null, 'all', null)
      } else {
        _openForm(stop, instanceDate, scope, masterId)
      }
    }
  }

  function openDeleteICloud(event: ICloudEventDisplay) {
    if (event.readonly) return
    startTransition(async () => {
      await deleteICloudEventDirect(event.calendarId, event.url)
      router.refresh()
    })
  }

  function openFromICloud(event: ICloudEventDisplay) {
    // Subscription calendar events are read-only
    if (event.readonly) return
    // Recurring iCloud events get a recurrence scope dialog first
    if (event.recurrenceRule) {
      setICloudRecurrenceDialog(event)
      return
    }
    _openICloudForm(event, null)
  }

  function handleICloudRecurrenceSelect(scope: RecurrenceScope) {
    if (!icloudRecurrenceDialog) return
    const event = icloudRecurrenceDialog
    setICloudRecurrenceDialog(null)
    _openICloudForm(event, scope)
  }

  function _openICloudForm(event: ICloudEventDisplay, scope: RecurrenceScope | null) {
    if (scope === 'one' || scope === 'future') {
      // Create a local-only Cairn stop at this occurrence date; leave the iCloud series unchanged
      openNew(new Date(event.startDate))
      return
    }
    // scope === 'all' or non-recurring: link form to the iCloud event (syncs on save)
    setSelectedStop(null)
    setFormICloudSeed(event)
    setFormInitialDate(null)
    setFormOccurrenceDate(null)
    setFormOccurrenceScope(null)
    setFormMasterId(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelectedStop(null)
    setFormInitialDate(null)
    setFormICloudSeed(null)
    setFormOccurrenceDate(null)
    setFormOccurrenceScope(null)
    setFormMasterId(null)
  }

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
  const viewProps = {
    stops, icloudEvents, anchor, calendarMode, calendarColorMap,
    onSelectStop: openEdit,
    onDeleteStop: openDelete,
    onSelectICloudEvent: openFromICloud,
    onDeleteICloudEvent: openDeleteICloud,
    onDayClick: openNew,
  }

  return (
    <>
      <PlatformHeader title={terms.itinerary} />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">

        {/* ── Calendar panel ── */}
        <div
          className={`${showForm ? 'hidden md:flex' : 'flex'} flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden min-w-0`}
        >
          {/* Nav bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0 flex-wrap gap-y-1.5">
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setAnchor(d => navigate(view, d, -1, calendarMode))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>
                Today
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setAnchor(d => navigate(view, d, 1, calendarMode))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <span className="text-sm font-medium flex-1 min-w-0 truncate">
              {navLabel(view, anchor, calendarMode)}
            </span>

            {eventsLoading && (
              <span className="text-xs text-muted-foreground animate-pulse shrink-0">
                Loading calendars…
              </span>
            )}

            <div className="flex items-center rounded-md border divide-x overflow-hidden text-xs shrink-0">
              {(Object.entries(viewLabels) as [CalendarView, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 transition-colors ${
                    view === v
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-md border divide-x overflow-hidden text-xs shrink-0">
              {MODE_OPTIONS.map(opt => (
                <Tooltip key={opt.value}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCalendarMode(opt.value)}
                      className={`px-2.5 py-1 transition-colors ${
                        calendarMode === opt.value
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <span className="hidden sm:inline">{opt.label}</span>
                      <span className="sm:hidden">{opt.short}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{opt.tip}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNew()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add {terms.stops.slice(0, -1).toLowerCase()}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push('/settings?section=calendar')}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Calendar settings</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Calendar body */}
          <div className="flex-1 overflow-auto min-h-0">
            {view === 'month' && <MonthView {...viewProps} />}
            {view === 'week'  && <WeekView  {...viewProps} />}
            {view === 'day'   && <DayView   {...viewProps} />}
          </div>
        </div>

        {/* ── Form panel ── */}
        {showForm && (
          <div className="flex flex-col w-full md:w-80 lg:w-96 rounded-lg border border-border bg-card overflow-hidden shrink-0">
            <StopForm
              key={selectedStop?.id ?? formICloudSeed?.uid ?? 'new'}
              stop={selectedStop}
              initialDate={formInitialDate}
              icloudSeed={formICloudSeed}
              markers={markers}
              calendars={calendars}
              occurrenceDate={formOccurrenceDate}
              occurrenceScope={formOccurrenceScope}
              masterId={formMasterId}
              onClose={closeForm}
            />
          </div>
        )}


      </div>

      {/* Recurrence dialog — Cairn stops */}
      <RecurrenceDialog
        open={!!recurrenceDialog}
        mode={recurrenceDialog?.mode ?? 'edit'}
        onSelect={handleRecurrenceSelect}
        onCancel={() => setRecurrenceDialog(null)}
      />

      {/* Recurrence dialog — iCloud events (edit-only; delete stays in iCloud) */}
      <RecurrenceDialog
        open={!!icloudRecurrenceDialog}
        mode="edit"
        onSelect={handleICloudRecurrenceSelect}
        onCancel={() => setICloudRecurrenceDialog(null)}
      />
    </>
  )
}
