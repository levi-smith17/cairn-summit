import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { expandStopOccurrences } from '@/lib/recurrence'
import { ItineraryClient } from './components/itinerary-client'
import type { StopWithMarkers } from './components/itinerary-client'

export default async function ItineraryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  // DB-only queries — fast, no network I/O
  const [rawStops, markers, calendars] = await Promise.all([
    prisma.stop.findMany({
      where: { wayfarerId },
      include: { markers: { include: { marker: true } } },
      orderBy: { startDate: 'asc' },
    }),
    prisma.marker.findMany({
      where: { wayfarerId },
      orderBy: { name: 'asc' },
    }),
    prisma.iCloudCalendar.findMany({
      where: { wayfarerId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, color: true },
    }),
  ])

  // Expand recurring master stops into virtual occurrences for a ±6 month window.
  // Master stops (recurrenceRule set, no masterStopId) are kept in the array so the
  // client can look them up by id for "edit all" scope; view components skip rendering them.
  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  const to = new Date()
  to.setMonth(to.getMonth() + 6)

  const stops: StopWithMarkers[] = []
  for (const s of rawStops) {
    stops.push({
      id: s.id,
      title: s.title,
      notes: s.notes,
      location: s.location,
      startDate: s.startDate,
      endDate: s.endDate,
      allDay: s.allDay,
      icloudCalendarId: s.icloudCalendarId,
      recurrenceRule: s.recurrenceRule,
      masterStopId: s.masterStopId,
      markers: s.markers,
    })

    if (s.recurrenceRule && !s.masterStopId) {
      const occurrences = expandStopOccurrences(
        s.id, s.startDate, s.endDate, s.recurrenceRule, s.exceptionDates, from, to,
      )
      for (const occ of occurrences) {
        stops.push({
          id: `${s.id}::${occ.startDate.toISOString()}`,
          title: s.title,
          notes: s.notes,
          location: s.location,
          startDate: occ.startDate,
          endDate: occ.endDate,
          allDay: s.allDay,
          icloudCalendarId: s.icloudCalendarId,
          recurrenceRule: s.recurrenceRule,
          masterStopId: null,
          markers: s.markers,
        })
      }
    }
  }

  // iCloud and subscription events are fetched client-side on mount (see fetchExternalCalendarEvents)
  return (
    <ItineraryClient
      stops={stops}
      markers={markers}
      calendars={calendars}
    />
  )
}
