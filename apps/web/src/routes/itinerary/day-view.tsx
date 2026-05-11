import { Lock } from 'lucide-react'
import { toLuvi, type CalendarMode } from '@/lib/luvi'
import { contrastColor } from '@/lib/color'
import { useTerminology } from '@/contexts/terminology-context'
import { EventPopover } from './event-popover'
import type { StopWithMarkers, ICloudEventDisplay } from './itinerary-client'

interface DayViewProps {
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function DayView({ stops, icloudEvents, anchor, calendarMode, calendarColorMap, onSelectStop, onDeleteStop, onSelectICloudEvent, onDeleteICloudEvent, onDayClick }: DayViewProps) {
  const { terms } = useTerminology()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = isSameDay(anchor, today)
  const dayStops = stopsForDay(stops, anchor)
  const dayICloud = icloudEventsForDay(icloudEvents, anchor)
  const luvi = calendarMode !== 'gregorian' ? toLuvi(anchor) : null

  const allDayStops = dayStops.filter(s => s.allDay)
  const timedStops = dayStops
    .filter(s => !s.allDay)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const allDayICloud = dayICloud.filter(e => e.allDay)
  const timedICloud = dayICloud
    .filter(e => !e.allDay)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4">

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-3xl font-bold tabular-nums ${
                isToday ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {anchor.getDate()}
            </div>
            <div>
              <div className="text-sm font-medium leading-tight">
                {anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
              {luvi && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span>{luvi.monthName}{luvi.week}</span>
                  {luvi.dayName && (
                    <span className="text-muted-foreground/70"> · {luvi.dayName}</span>
                  )}
                </div>
              )}
              {isToday && (
                <div className="text-xs text-muted-foreground mt-0.5">Today</div>
              )}
            </div>
          </div>
        </div>

        {(allDayStops.length > 0 || allDayICloud.length > 0) && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              All Day
            </div>
            <div className="flex flex-col gap-1.5">
              {allDayICloud.map(e => (
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: e.color, color: contrastColor(e.color) }}
                  >
                    {e.readonly && <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    <span className="text-sm flex-1 truncate font-medium">{e.title}</span>
                  </button>
                </EventPopover>
              ))}
              {allDayStops.map(stop => {
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
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:opacity-90 transition-opacity w-full"
                      style={{ backgroundColor: color, color: contrastColor(color) }}
                    >
                      <span className="font-medium text-sm flex-1 truncate">{stop.title}</span>
                      {stop.markers.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {stop.markers.slice(0, 3).map(m => (
                            <span key={m.markerId} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 hidden sm:inline">
                              {m.marker.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </EventPopover>
                )
              })}
            </div>
          </div>
        )}

        {(timedStops.length > 0 || timedICloud.length > 0) && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {terms.on_the_trail}
            </div>
            <div className="flex flex-col gap-2">
              {timedStops.map(stop => {
                const color = stop.markers[0]?.marker.color ?? (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ?? '#6b7280'
                const startDate = new Date(stop.startDate)
                const endDate = stop.endDate ? new Date(stop.endDate) : null
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
                    <button className="flex items-start gap-3 text-left p-3 rounded-lg border hover:bg-muted/40 transition-colors w-full">
                      <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{stop.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(startDate)}{endDate && ` – ${formatTime(endDate)}`}
                        </div>
                        {stop.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{stop.notes}</div>}
                        {stop.markers.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {stop.markers.map(m => (
                              <span key={m.markerId} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: m.marker.color, color: contrastColor(m.marker.color) }}>
                                {m.marker.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  </EventPopover>
                )
              })}
              {timedICloud.map(e => {
                const startDate = new Date(e.startDate)
                const endDate = e.endDate ? new Date(e.endDate) : null
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
                    <button className="flex items-start gap-3 p-3 rounded-lg border w-full text-left hover:bg-muted/40 transition-colors">
                      <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {e.readonly && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          {e.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(startDate)}{endDate && ` – ${formatTime(endDate)}`}
                        </div>
                        {e.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.notes}</div>}
                      </div>
                    </button>
                  </EventPopover>
                )
              })}
            </div>
          </div>
        )}

        {dayStops.length === 0 && dayICloud.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-sm text-muted-foreground">
              No {terms.stops.toLowerCase()} on this {terms.legs.slice(0, -1).toLowerCase()}.
            </p>
            <button
              onClick={() => onDayClick(anchor)}
              className="text-xs text-primary hover:underline"
            >
              Add one to get started.
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
