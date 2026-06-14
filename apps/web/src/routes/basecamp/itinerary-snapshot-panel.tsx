import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Lock } from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'
import { fetchExternalCalendarEvents } from '@/lib/api/basecamp'

interface CairnStop {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string | null
  allDay: boolean
  color: string
}

interface ExternalEvent {
  uid: string
  title: string
  startDate: string
  endDate: string | null
  allDay: boolean
  color: string
  readonly: boolean
}

interface DayEvent {
  key: string
  title: string
  startDate: Date
  allDay: boolean
  color: string
  readonly: boolean
}

interface ItinerarySnapshotPanelProps {
  stops: CairnStop[]
}

function eventsForDay(cairnStops: CairnStop[], externalEvents: ExternalEvent[], date: Date): DayEvent[] {
  const d = new Date(date); d.setHours(0, 0, 0, 0)

  const stops: DayEvent[] = cairnStops
    .filter(s => {
      const start = new Date(s.startDate); start.setHours(0, 0, 0, 0)
      const end = s.endDate ? new Date(s.endDate) : new Date(s.startDate); end.setHours(0, 0, 0, 0)
      return d >= start && d <= end
    })
    .map(s => ({
      key: s.id,
      title: s.title,
      startDate: new Date(s.startDate),
      allDay: s.allDay,
      color: s.color,
      readonly: false,
    }))

  const external: DayEvent[] = externalEvents
    .filter(e => {
      const start = new Date(e.startDate); start.setHours(0, 0, 0, 0)
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate); end.setHours(0, 0, 0, 0)
      return d >= start && d <= end
    })
    .map(e => ({
      key: e.uid,
      title: e.title,
      startDate: new Date(e.startDate),
      allDay: e.allDay,
      color: e.color,
      readonly: e.readonly,
    }))

  return [...stops, ...external].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    return a.startDate.getTime() - b.startDate.getTime()
  })
}

function formatStopTime(date: Date, allDay: boolean) {
  if (allDay) return null
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function upcomingWindow() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 4)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

export function ItinerarySnapshotPanel({ stops }: ItinerarySnapshotPanelProps) {
  const { terms } = useTerminology()
  const { from, to } = upcomingWindow()

  const { data: externalEvents = [] } = useQuery({
    queryKey: ['itinerary-events', 'basecamp-snapshot', from.toISOString()],
    queryFn: async () => {
      const events = await fetchExternalCalendarEvents()
      return events.filter(e => {
        const start = new Date(e.startDate)
        return start >= from && start <= to
      })
    },
    staleTime: 5 * 60 * 1000,
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: { label: string; date: Date }[] = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      date: d,
    }
  })

  const dayData = days.map(({ label, date }) => ({
    label,
    date,
    events: eventsForDay(stops, externalEvents, date),
  }))

  const hasAny = dayData.some(d => d.events.length > 0)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.itinerary}</span>
        <Link
          to="/itinerary"
          className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {!hasAny ? (
        <p className="text-xs text-muted-foreground px-4 py-3">
          No events in the next 4 days.
        </p>
      ) : (
        <div className="divide-y overflow-y-auto h-64">
          {dayData.map(({ label, events }) => {
            if (events.length === 0) return null
            return (
              <div key={label} className="px-4 py-2.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {label}
                </p>
                <div className="flex flex-col gap-1">
                  {events.map(event => {
                    const timeStr = formatStopTime(event.startDate, event.allDay)
                    return (
                      <Link
                        key={event.key}
                        to="/itinerary"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                        <span className="text-xs truncate flex-1">{event.title}</span>
                        {event.readonly && <Lock className="h-3 w-3 text-muted-foreground shrink-0 opacity-60" />}
                        {timeStr && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{timeStr}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
