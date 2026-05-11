import { Lock, Repeat } from 'lucide-react'
import { toLuvi, luviMonthDates, LUVI_DAYS, type CalendarMode } from '@/lib/luvi'
import { contrastColor } from '@/lib/color'
import { EventPopover } from './event-popover'
import type { StopWithMarkers, ICloudEventDisplay } from './itinerary-client'

const GREGORIAN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthViewProps {
  stops: StopWithMarkers[]
  icloudEvents: ICloudEventDisplay[]
  anchor: Date
  calendarMode: CalendarMode
  calendarColorMap: Record<string, string>
  onSelectStop: (stop: StopWithMarkers) => void
  onDeleteStop: (stop: StopWithMarkers) => void
  onSelectICloudEvent: (event: ICloudEventDisplay) => void
  onDeleteICloudEvent: (event: ICloudEventDisplay) => void
  onDayClick: (date: Date) => void
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function stopsForDay(stops: StopWithMarkers[], date: Date): StopWithMarkers[] {
  return stops.filter(s => {
    if (s.recurrenceRule && !s.masterStopId && !s.id.includes('::')) return false
    const start = new Date(s.startDate)
    const end = s.endDate ? new Date(s.endDate) : new Date(s.startDate)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })
}

function icloudEventsForDay(events: ICloudEventDisplay[], date: Date): ICloudEventDisplay[] {
  return events.filter(e => {
    const start = new Date(e.startDate)
    const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })
}

function formatPillTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(':00', '')
    .replace(' ', '')
    .toLowerCase()
}

type DayEvent =
  | { kind: 'stop';   stop: StopWithMarkers }
  | { kind: 'icloud'; event: ICloudEventDisplay }

function sortedDayEvents(stops: StopWithMarkers[], icloudEvents: ICloudEventDisplay[]): DayEvent[] {
  const items: DayEvent[] = [
    ...stops.map(s => ({ kind: 'stop' as const, stop: s })),
    ...icloudEvents.map(e => ({ kind: 'icloud' as const, event: e })),
  ]
  return items.sort((a, b) => {
    const aAllDay = a.kind === 'stop' ? a.stop.allDay : a.event.allDay
    const bAllDay = b.kind === 'stop' ? b.stop.allDay : b.event.allDay
    if (aAllDay && !bAllDay) return -1
    if (!aAllDay && bAllDay) return 1
    const aTime = new Date(a.kind === 'stop' ? a.stop.startDate : a.event.startDate).getTime()
    const bTime = new Date(b.kind === 'stop' ? b.stop.startDate : b.event.startDate).getTime()
    return aTime - bTime
  })
}

function EventPills({
  stops,
  icloudEvents,
  calendarColorMap,
  onSelectStop,
  onDeleteStop,
  onSelectICloudEvent,
  onDeleteICloudEvent,
}: {
  stops: StopWithMarkers[]
  icloudEvents: ICloudEventDisplay[]
  calendarColorMap: Record<string, string>
  onSelectStop: (s: StopWithMarkers) => void
  onDeleteStop: (s: StopWithMarkers) => void
  onSelectICloudEvent: (e: ICloudEventDisplay) => void
  onDeleteICloudEvent: (e: ICloudEventDisplay) => void
}) {
  const events = sortedDayEvents(stops, icloudEvents)
  if (!events.length) return null
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden">
      {events.map(item => {
        if (item.kind === 'stop') {
          const { stop } = item
          const color = stop.markers[0]?.marker.color ?? (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ?? '#6b7280'
          const timeStr = stop.allDay ? null : formatPillTime(new Date(stop.startDate))
          return (
            <EventPopover
              key={stop.id}
              title={stop.title}
              startDate={stop.startDate}
              endDate={stop.endDate}
              allDay={stop.allDay}
              location={stop.location}
              notes={stop.notes}
              color={color}
              onEdit={() => onSelectStop(stop)}
              onDelete={() => onDeleteStop(stop)}
            >
              <button
                className="text-left text-xs px-2 py-1 rounded truncate leading-tight font-medium hover:opacity-80 transition-opacity w-full"
                style={{ backgroundColor: color, color: contrastColor(color) }}
              >
                {timeStr ? `${timeStr} ${stop.title}` : stop.title}
              </button>
            </EventPopover>
          )
        }
        const { event } = item
        const timeStr = event.allDay ? null : formatPillTime(new Date(event.startDate))
        return (
          <EventPopover
            key={event.uid}
            title={event.title}
            startDate={event.startDate}
            endDate={event.endDate}
            allDay={event.allDay}
            location={event.location}
            notes={event.notes}
            color={event.color}
            readonly={event.readonly}
            onEdit={event.readonly ? undefined : () => onSelectICloudEvent(event)}
            onDelete={event.readonly ? undefined : () => onDeleteICloudEvent(event)}
          >
            <button
              className="text-left text-xs px-2 py-1 rounded leading-tight font-medium flex items-center gap-1 overflow-hidden w-full hover:opacity-80 transition-opacity"
              style={{ backgroundColor: event.color, color: contrastColor(event.color) }}
            >
              {event.readonly ? (
                <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" />
              ) : event.recurrenceRule ? (
                <Repeat className="h-2.5 w-2.5 shrink-0 opacity-70" />
              ) : null}
              <span className="truncate">{timeStr ? `${timeStr} ${event.title}` : event.title}</span>
            </button>
          </EventPopover>
        )
      })}
    </div>
  )
}

function GregorianMonthGrid({
  stops,
  icloudEvents,
  anchor,
  calendarMode,
  calendarColorMap,
  onSelectStop,
  onDeleteStop,
  onSelectICloudEvent,
  onDeleteICloudEvent,
  onDayClick,
}: MonthViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const startDay = new Date(firstOfMonth)
  startDay.setDate(startDay.getDate() - startDay.getDay())

  const days: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDay)
    d.setDate(startDay.getDate() + i)
    return d
  })

  const currentMonth = anchor.getMonth()
  const showLuvi = calendarMode === 'luvi'

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b shrink-0">
        {GREGORIAN_WEEKDAYS.map(label => (
          <div key={label} className="py-1.5 text-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label[0]}</span>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 flex-1"
        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
      >
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const isCurrentMonth = day.getMonth() === currentMonth
          const dayStops = stopsForDay(stops, day)
          const dayICloud = icloudEventsForDay(icloudEvents, day)
          const luvi = showLuvi ? toLuvi(day) : null

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`border-b border-r last:border-r-0 p-0.5 sm:p-1 cursor-pointer hover:bg-muted/40 transition-colors flex flex-col overflow-hidden ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-0.5 gap-0.5 shrink-0">
                <span
                  className={`text-[11px] sm:text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full shrink-0 ${
                    isToday ? 'bg-foreground text-background' : 'text-muted-foreground'
                  }`}
                >
                  {day.getDate()}
                </span>
                {luvi && (
                  <div className="text-right min-w-0 overflow-hidden">
                    <div className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight truncate">
                      {luvi.friendly}
                    </div>
                    {luvi.dayName && (
                      <div className="text-[7px] sm:text-[8px] text-muted-foreground/70 leading-tight truncate hidden sm:block">
                        {luvi.dayName}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <EventPills stops={dayStops} icloudEvents={dayICloud} calendarColorMap={calendarColorMap} onSelectStop={onSelectStop} onDeleteStop={onDeleteStop} onSelectICloudEvent={onSelectICloudEvent} onDeleteICloudEvent={onDeleteICloudEvent} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LuviFullMonthGrid({ stops, icloudEvents, anchor, calendarColorMap, onSelectStop, onDeleteStop, onSelectICloudEvent, onDeleteICloudEvent, onDayClick }: MonthViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthDays = luviMonthDates(anchor)
  const weekA = monthDays.slice(0, 13)
  const weekI = monthDays.slice(13, 26)

  const luviAnchor = toLuvi(anchor)
  const monthLabel = luviAnchor.monthName

  return (
    <div className="flex flex-col h-full overflow-x-auto">
      <div className="min-w-[520px] flex flex-col flex-1">
        <div className="grid border-b shrink-0" style={{ gridTemplateColumns: '80px repeat(13, minmax(0, 1fr))' }}>
          <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground border-r">
            {monthLabel}
          </div>
          {LUVI_DAYS.map(name => (
            <div key={name} className="py-1.5 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
              <span className="hidden md:inline">{name}</span>
              <span className="md:hidden">{name.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        <div
          className="grid flex-1 border-b"
          style={{ gridTemplateColumns: '80px repeat(13, minmax(0, 1fr))' }}
        >
          <div className="flex items-center justify-center border-r px-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide rotate-0">
              {monthLabel}a
            </span>
          </div>
          {weekA.map((day, i) => {
            const isToday = isSameDay(day, today)
            const dayStops = stopsForDay(stops, day)
            const dayICloud = icloudEventsForDay(icloudEvents, day)
            const luvi = toLuvi(day)
            return (
              <div
                key={i}
                onClick={() => onDayClick(day)}
                className="border-r last:border-r-0 p-0.5 sm:p-1 cursor-pointer hover:bg-muted/40 transition-colors flex flex-col overflow-hidden"
              >
                <div className="flex flex-col items-center mb-0.5">
                  <span
                    className={`text-[10px] sm:text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-foreground text-background' : 'text-muted-foreground'
                    }`}
                  >
                    {luvi.dayOfMonth}
                  </span>
                  <span className="text-[8px] text-muted-foreground/70 hidden sm:block">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <EventPills stops={dayStops} icloudEvents={dayICloud} calendarColorMap={calendarColorMap} onSelectStop={onSelectStop} onDeleteStop={onDeleteStop} onSelectICloudEvent={onSelectICloudEvent} onDeleteICloudEvent={onDeleteICloudEvent} />
              </div>
            )
          })}
        </div>

        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: '80px repeat(13, minmax(0, 1fr))' }}
        >
          <div className="flex items-center justify-center border-r px-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide">
              {monthLabel}i
            </span>
          </div>
          {weekI.map((day, i) => {
            const isToday = isSameDay(day, today)
            const dayStops = stopsForDay(stops, day)
            const dayICloud = icloudEventsForDay(icloudEvents, day)
            const luvi = toLuvi(day)
            return (
              <div
                key={i}
                onClick={() => onDayClick(day)}
                className="border-r last:border-r-0 p-0.5 sm:p-1 cursor-pointer hover:bg-muted/40 transition-colors flex flex-col overflow-hidden"
              >
                <div className="flex flex-col items-center mb-0.5">
                  <span
                    className={`text-[10px] sm:text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-foreground text-background' : 'text-muted-foreground'
                    }`}
                  >
                    {luvi.dayOfMonth}
                  </span>
                  <span className="text-[8px] text-muted-foreground/70 hidden sm:block">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <EventPills stops={dayStops} icloudEvents={dayICloud} calendarColorMap={calendarColorMap} onSelectStop={onSelectStop} onDeleteStop={onDeleteStop} onSelectICloudEvent={onSelectICloudEvent} onDeleteICloudEvent={onDeleteICloudEvent} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function MonthView(props: MonthViewProps) {
  if (props.calendarMode === 'luvi-full') return <LuviFullMonthGrid {...props} />
  return <GregorianMonthGrid {...props} />
}
