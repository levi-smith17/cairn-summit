'use client'

import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { toLuvi, luviWeekDates, LUVI_DAYS, type CalendarMode } from '@/lib/luvi'
import { contrastColor } from '@/lib/color'
import { EventPopover } from './event-popover'
import type { StopWithMarkers, ICloudEventDisplay } from './itinerary-client'

const PX_PER_HOUR = 56
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const COL_TEMPLATE = '48px repeat(7, minmax(0, 1fr))'

interface WeekViewProps {
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
    d.setHours(0, 0, 0, 0); start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })
}

function icloudEventsForDay(events: ICloudEventDisplay[], date: Date): ICloudEventDisplay[] {
  return events.filter(e => {
    const start = new Date(e.startDate)
    const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0); start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })
}

function formatHourLabel(h: number): string {
  if (h < 12) return `${h || 12}am`
  return `${h === 12 ? 12 : h - 12}pm`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(':00', '').replace(' ', '').toLowerCase()
}

function eventPosition(start: Date, end: Date | null): { top: number; height: number } {
  const startFrac = start.getHours() + start.getMinutes() / 60
  const endFrac = end ? end.getHours() + end.getMinutes() / 60 : startFrac + 1
  const clamped = Math.max(endFrac, startFrac + 0.5)
  return {
    top: Math.round(startFrac * PX_PER_HOUR),
    height: Math.round((clamped - startFrac) * PX_PER_HOUR),
  }
}

// ─── Gregorian / Luvi-overlay week with time axis ────────────────────────────

function GregorianWeekGrid({ stops, icloudEvents, anchor, calendarMode, calendarColorMap, onSelectStop, onDeleteStop, onSelectICloudEvent, onDeleteICloudEvent, onDayClick }: WeekViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const weekStart = new Date(anchor)
  weekStart.setDate(anchor.getDate() - anchor.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const showLuvi = calendarMode === 'luvi'

  const hasAllDay = days.some(day =>
    stopsForDay(stops, day).some(s => s.allDay) ||
    icloudEventsForDay(icloudEvents, day).some(e => e.allDay)
  )

  // Single scroll container — scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * PX_PER_HOUR
  }, [])

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overflow-x-auto">
      <div className="min-w-[560px]">

        {/* ── Sticky header block (day names + all-day row) ── */}
        <div className="sticky top-0 z-20 bg-card">
          {/* Day headers */}
          <div className="grid border-b" style={{ gridTemplateColumns: COL_TEMPLATE }}>
            <div className="border-r" />
            {days.map((day, i) => {
              const isToday = isSameDay(day, today)
              const luvi = showLuvi ? toLuvi(day) : null
              return (
                <div
                  key={i}
                  onClick={() => onDayClick(day)}
                  className="py-2 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors border-r last:border-r-0"
                >
                  <div className="text-xs text-muted-foreground mb-0.5 truncate">
                    {luvi?.dayName || day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-semibold mx-auto h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-foreground text-background' : ''}`}>
                    {day.getDate()}
                  </div>
                  {luvi && (
                    <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight truncate px-0.5">
                      {luvi.friendly}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* All-day row */}
          {hasAllDay && (
            <div className="grid border-b" style={{ gridTemplateColumns: COL_TEMPLATE }}>
              <div className="border-r flex items-start justify-end pr-1.5 pt-1">
                <span className="text-[9px] text-muted-foreground leading-none">all day</span>
              </div>
              {days.map((day, i) => {
                const dayStops = stopsForDay(stops, day).filter(s => s.allDay)
                const dayICloud = icloudEventsForDay(icloudEvents, day).filter(e => e.allDay)
                return (
                  <div key={i} className="border-r last:border-r-0 p-0.5 flex flex-col gap-0.5 min-h-[28px]">
                    {dayStops.map(stop => {
                      const color = stop.markers[0]?.marker.color ?? (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ?? '#6b7280'
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
                            className="text-left w-full px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-90"
                            style={{ backgroundColor: color, color: contrastColor(color) }}
                          >
                            {stop.title}
                          </button>
                        </EventPopover>
                      )
                    })}
                    {dayICloud.map(e => (
                      <EventPopover
                        key={e.uid}
                        title={e.title}
                        startDate={e.startDate}
                        endDate={e.endDate}
                        allDay={e.allDay}
                        location={e.location}
                        notes={e.notes}
                        color={e.color}
                        readonly={e.readonly}
                        onEdit={e.readonly ? undefined : () => onSelectICloudEvent(e)}
                        onDelete={e.readonly ? undefined : () => onDeleteICloudEvent(e)}
                      >
                        <button
                          className="text-left w-full px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 overflow-hidden hover:opacity-90"
                          style={{ backgroundColor: e.color, color: contrastColor(e.color) }}
                        >
                          {e.readonly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" />}
                          <span className="truncate">{e.title}</span>
                        </button>
                      </EventPopover>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Time grid ── */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: COL_TEMPLATE, height: 24 * PX_PER_HOUR }}
        >
          {/* Hour labels */}
          <div className="relative border-r">
            {HOURS.filter(h => h > 0).map(h => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-1.5"
                style={{ top: h * PX_PER_HOUR, height: PX_PER_HOUR }}
              >
                <span className="text-[9px] text-muted-foreground leading-none -mt-[5px]">
                  {formatHourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const dayStops = stopsForDay(stops, day).filter(s => !s.allDay)
            const dayICloud = icloudEventsForDay(icloudEvents, day).filter(e => !e.allDay)
            return (
              <div
                key={i}
                className="relative border-r last:border-r-0 cursor-pointer"
                onClick={() => onDayClick(day)}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full border-t border-border/40" style={{ top: h * PX_PER_HOUR }} />
                ))}
                {/* Half-hour lines */}
                {HOURS.map(h => (
                  <div key={`h${h}`} className="absolute w-full border-t border-border/20 border-dashed" style={{ top: h * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                ))}

                {/* Cairn stops */}
                {dayStops.map(stop => {
                  const color = stop.markers[0]?.marker.color ?? (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ?? '#6b7280'
                  const { top, height } = eventPosition(new Date(stop.startDate), stop.endDate ? new Date(stop.endDate) : null)
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
                        className="absolute inset-x-0.5 rounded px-1.5 text-left overflow-hidden hover:opacity-90 transition-opacity z-10"
                        style={{ top, height, backgroundColor: color, color: contrastColor(color) }}
                      >
                        <div className="text-[10px] font-semibold truncate leading-tight">{stop.title}</div>
                        <div className="text-[9px] opacity-80">{formatTime(new Date(stop.startDate))}</div>
                      </button>
                    </EventPopover>
                  )
                })}

                {/* iCloud / subscription events */}
                {dayICloud.map(e => {
                  const { top, height } = eventPosition(new Date(e.startDate), e.endDate ? new Date(e.endDate) : null)
                  return (
                    <EventPopover
                      key={e.uid}
                      title={e.title}
                      startDate={e.startDate}
                      endDate={e.endDate}
                      allDay={e.allDay}
                      location={e.location}
                      notes={e.notes}
                      color={e.color}
                      readonly={e.readonly}
                      onEdit={e.readonly ? undefined : () => onSelectICloudEvent(e)}
                      onDelete={e.readonly ? undefined : () => onDeleteICloudEvent(e)}
                    >
                      <button
                        className="absolute inset-x-0.5 rounded px-1.5 text-left overflow-hidden z-10 hover:opacity-90 transition-opacity"
                        style={{ top, height, backgroundColor: e.color, color: contrastColor(e.color) }}
                      >
                        <div className="text-[10px] font-semibold truncate leading-tight flex items-center gap-0.5">
                          {e.readonly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" />}
                          <span className="truncate">{e.title}</span>
                        </div>
                        <div className="text-[9px] opacity-80">{formatTime(new Date(e.startDate))}</div>
                      </button>
                    </EventPopover>
                  )
                })}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

// ─── Full Luvi 13-column week (simple list layout) ───────────────────────────

function SimpleEventColumn({
  day, stops, icloudEvents, calendarColorMap, onSelectStop, onDeleteStop, onSelectICloudEvent, onDeleteICloudEvent, onDayClick,
}: {
  day: Date
  stops: StopWithMarkers[]
  icloudEvents: ICloudEventDisplay[]
  calendarColorMap: Record<string, string>
  onSelectStop: (s: StopWithMarkers) => void
  onDeleteStop: (s: StopWithMarkers) => void
  onSelectICloudEvent: (e: ICloudEventDisplay) => void
  onDeleteICloudEvent: (e: ICloudEventDisplay) => void
  onDayClick: (d: Date) => void
}) {
  return (
    <div
      className="border-r last:border-r-0 p-1 flex flex-col gap-1 min-h-[160px] cursor-pointer hover:bg-muted/20 transition-colors"
      onClick={() => onDayClick(day)}
    >
      {stops.map(stop => {
        const color = stop.markers[0]?.marker.color ?? (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ?? '#6b7280'
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
              className="text-left w-full px-1.5 py-1 rounded text-xs hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color, color: contrastColor(color) }}
            >
              <div className="font-medium truncate leading-tight">{stop.title}</div>
              <div className="text-[9px] opacity-80 mt-px">
                {stop.allDay ? 'All day' : formatTime(new Date(stop.startDate))}
              </div>
            </button>
          </EventPopover>
        )
      })}
      {icloudEvents.map(e => (
        <EventPopover
          key={e.uid}
          title={e.title}
          startDate={e.startDate}
          endDate={e.endDate}
          allDay={e.allDay}
          location={e.location}
          notes={e.notes}
          color={e.color}
          readonly={e.readonly}
          onEdit={e.readonly ? undefined : () => onSelectICloudEvent(e)}
          onDelete={e.readonly ? undefined : () => onDeleteICloudEvent(e)}
        >
          <button
            className="text-left w-full px-1.5 py-1 rounded text-xs hover:opacity-90 transition-opacity"
            style={{ backgroundColor: e.color, color: contrastColor(e.color) }}
          >
            <div className="font-medium truncate leading-tight flex items-center gap-0.5">
              {e.readonly && <Lock className="h-2.5 w-2.5 shrink-0 opacity-70" />}
              <span className="truncate">{e.title}</span>
            </div>
            <div className="text-[9px] opacity-80 mt-px">
              {e.allDay ? 'All day' : formatTime(new Date(e.startDate))}
            </div>
          </button>
        </EventPopover>
      ))}
    </div>
  )
}

function LuviFullWeekGrid({ stops, icloudEvents, anchor, calendarColorMap, onSelectStop, onDeleteStop, onSelectICloudEvent, onDeleteICloudEvent, onDayClick }: WeekViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = luviWeekDates(anchor)
  const luviAnchor = toLuvi(anchor)
  const weekLabel = `${luviAnchor.monthName} — Week ${luviAnchor.week}`

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex flex-col h-full min-w-[700px]">
        {/* Week name spanning full width */}
        <div className="border-b px-3 py-1.5 text-xs font-semibold text-muted-foreground shrink-0">
          {weekLabel}
        </div>

        {/* Day name headers — 13 equal columns */}
        <div className="grid border-b shrink-0" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
          {LUVI_DAYS.map(name => (
            <div key={name} className="py-1.5 text-center border-r last:border-r-0">
              <div className="text-xs font-medium text-muted-foreground">
                <span className="hidden lg:inline">{name}</span>
                <span className="lg:hidden">{name.slice(0, 3)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Day number row */}
        <div className="grid border-b shrink-0" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
          {days.map((day, i) => {
            const isToday = isSameDay(day, today)
            const luvi = toLuvi(day)
            return (
              <div
                key={i}
                onClick={() => onDayClick(day)}
                className="py-1.5 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className={`text-xs font-semibold mx-auto h-6 w-6 flex items-center justify-center rounded-full ${isToday ? 'bg-foreground text-background' : ''}`}>
                  {luvi.dayOfMonth}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Event columns */}
        <div className="grid flex-1 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
          {days.map((day, i) => (
            <SimpleEventColumn
              key={i}
              day={day}
              stops={stopsForDay(stops, day)}
              icloudEvents={icloudEventsForDay(icloudEvents, day)}
              calendarColorMap={calendarColorMap}
              onSelectStop={onSelectStop}
              onDeleteStop={onDeleteStop}
              onSelectICloudEvent={onSelectICloudEvent}
              onDeleteICloudEvent={onDeleteICloudEvent}
              onDayClick={onDayClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function WeekView(props: WeekViewProps) {
  if (props.calendarMode === 'luvi-full') return <LuviFullWeekGrid {...props} />
  return <GregorianWeekGrid {...props} />
}
