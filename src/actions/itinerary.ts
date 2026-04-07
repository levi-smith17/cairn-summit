'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { truncateRRule, toLocalDateKey } from '@/lib/recurrence'
import type { RecurrenceScope } from '@/app/(platform)/itinerary/components/recurrence-dialog'

export async function saveStop(data: {
  // Existing stop id — undefined when creating new or an exception instance
  id?: string
  // Recurrence exception fields (set when scope is 'one' or 'future')
  masterId?: string
  occurrenceDate?: Date
  occurrenceScope?: RecurrenceScope
  title: string
  notes?: string | null
  location?: string | null
  startDate: Date
  endDate?: Date | null
  allDay?: boolean
  markerIds?: string[]
  recurrenceRule?: string | null
  linkedIcloudEventUid?: string | null
  linkedIcloudEventUrl?: string | null
  linkedIcloudCalendarId?: string | null
  targetCalendarId?: string | null
}): Promise<{ icloudError?: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  const eventParams = {
    title:          data.title,
    startDate:      data.startDate,
    endDate:        data.endDate ?? null,
    allDay:         data.allDay ?? false,
    notes:          data.notes ?? null,
    location:       data.location ?? null,
    recurrenceRule: data.recurrenceRule ?? null,
  }

  // ── Handle "This and following" scope ────────────────────────────────────────
  if (data.occurrenceScope === 'future' && data.masterId && data.occurrenceDate) {
    const master = await prisma.stop.findFirst({ where: { id: data.masterId, wayfarerId } })
    if (!master) throw new Error('Master stop not found')

    // Truncate master's RRULE to end the day before this occurrence
    const truncated = master.recurrenceRule
      ? truncateRRule(master.recurrenceRule, data.occurrenceDate)
      : null
    await prisma.stop.update({
      where: { id: master.id },
      data: { recurrenceRule: truncated },
    })

    // Create a new master stop starting from this occurrence
    await prisma.stop.create({
      data: {
        title:          data.title,
        notes:          data.notes,
        location:       data.location,
        startDate:      data.startDate,
        endDate:        data.endDate,
        allDay:         data.allDay ?? false,
        recurrenceRule: data.recurrenceRule,
        wayfarerId,
        markers: { create: data.markerIds?.map(markerId => ({ markerId })) ?? [] },
      },
    })
    revalidatePath('/itinerary')
    return {}
  }

  // ── Handle "This event only" scope ───────────────────────────────────────────
  if (data.occurrenceScope === 'one' && data.masterId && data.occurrenceDate) {
    const master = await prisma.stop.findFirst({ where: { id: data.masterId, wayfarerId } })
    if (!master) throw new Error('Master stop not found')

    // Add occurrence date to master's exception list
    const existing: string[] = master.exceptionDates ? JSON.parse(master.exceptionDates) : []
    const dateKey = toLocalDateKey(data.occurrenceDate)
    if (!existing.includes(dateKey)) {
      await prisma.stop.update({
        where: { id: master.id },
        data: { exceptionDates: JSON.stringify([...existing, dateKey]) },
      })
    }

    // Create exception stop (no recurrenceRule, linked to master)
    await prisma.stop.create({
      data: {
        title:        data.title,
        notes:        data.notes,
        location:     data.location,
        startDate:    data.startDate,
        endDate:      data.endDate,
        allDay:       data.allDay ?? false,
        masterStopId: data.masterId,
        wayfarerId,
        markers: { create: data.markerIds?.map(markerId => ({ markerId })) ?? [] },
      },
    })
    revalidatePath('/itinerary')
    return {}
  }

  // ── Update existing stop ──────────────────────────────────────────────────────
  if (data.id) {
    const existing = await prisma.stop.findFirst({ where: { id: data.id, wayfarerId } })
    if (!existing) throw new Error('Not found')

    await prisma.stop.update({
      where: { id: data.id },
      data: {
        title:          data.title,
        notes:          data.notes,
        location:       data.location,
        startDate:      data.startDate,
        endDate:        data.endDate,
        allDay:         data.allDay ?? false,
        recurrenceRule: data.recurrenceRule,
        markers: {
          deleteMany: {},
          create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
        },
      },
    })

    // Sync to iCloud if linked
    if (existing.icloudCalendarId && existing.icloudEventUrl && existing.icloudEventUid) {
      const calendar = await prisma.iCloudCalendar.findUnique({ where: { id: existing.icloudCalendarId } })
      if (calendar) {
        try {
          const { decrypt } = await import('@/lib/encrypt')
          const { updateICloudEvent } = await import('@/lib/ical')
          await updateICloudEvent(
            calendar.appleId,
            decrypt(calendar.passwordEnc),
            existing.icloudEventUrl,
            { uid: existing.icloudEventUid, ...eventParams },
          )
        } catch {
          // iCloud sync failure is non-fatal for updates
        }
      }
    }

    revalidatePath('/itinerary')
    return {}
  }

  // ── Create new stop ───────────────────────────────────────────────────────────
  let icloudEventUid: string | undefined
  let icloudEventUrl: string | undefined
  let icloudCalendarId: string | undefined
  let icloudError: string | undefined

  if (data.linkedIcloudEventUid && data.linkedIcloudEventUrl && data.linkedIcloudCalendarId) {
    icloudEventUid   = data.linkedIcloudEventUid
    icloudEventUrl   = data.linkedIcloudEventUrl
    icloudCalendarId = data.linkedIcloudCalendarId

    const calendar = await prisma.iCloudCalendar.findFirst({
      where: { id: data.linkedIcloudCalendarId, wayfarerId },
    })
    if (calendar) {
      try {
        const { decrypt } = await import('@/lib/encrypt')
        const { updateICloudEvent } = await import('@/lib/ical')
        await updateICloudEvent(
          calendar.appleId,
          decrypt(calendar.passwordEnc),
          data.linkedIcloudEventUrl,
          { uid: data.linkedIcloudEventUid, ...eventParams },
        )
      } catch { /* non-fatal */ }
    }
  } else {
    const calendarQuery = 'targetCalendarId' in data
      ? (data.targetCalendarId
          ? prisma.iCloudCalendar.findFirst({ where: { id: data.targetCalendarId, wayfarerId } })
          : Promise.resolve(null))
      : prisma.iCloudCalendar.findFirst({ where: { wayfarerId }, orderBy: { createdAt: 'asc' } })

    const calendar = await calendarQuery
    if (calendar) {
      try {
        const { decrypt } = await import('@/lib/encrypt')
        const { createICloudEvent } = await import('@/lib/ical')
        const result = await createICloudEvent(
          calendar.appleId,
          decrypt(calendar.passwordEnc),
          calendar.calendarUrl,
          eventParams,
        )
        icloudEventUid   = result.uid
        icloudEventUrl   = result.url
        icloudCalendarId = calendar.id
      } catch (e) {
        icloudError = e instanceof Error ? e.message : 'iCloud sync failed'
      }
    }
  }

  await prisma.stop.create({
    data: {
      title:            data.title,
      notes:            data.notes,
      location:         data.location,
      startDate:        data.startDate,
      endDate:          data.endDate,
      allDay:           data.allDay ?? false,
      recurrenceRule:   data.recurrenceRule,
      wayfarerId,
      icloudEventUid:   icloudEventUid   ?? null,
      icloudEventUrl:   icloudEventUrl   ?? null,
      icloudCalendarId: icloudCalendarId ?? null,
      markers: {
        create: data.markerIds?.map(markerId => ({ markerId })) ?? [],
      },
    },
  })

  revalidatePath('/itinerary')
  return icloudError ? { icloudError } : {}
}

export async function deleteStop(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  const stop = await prisma.stop.findFirst({ where: { id, wayfarerId } })
  if (!stop) return

  if (stop.icloudEventUrl && stop.icloudCalendarId) {
    const calendar = await prisma.iCloudCalendar.findUnique({ where: { id: stop.icloudCalendarId } })
    if (calendar) {
      try {
        const { decrypt } = await import('@/lib/encrypt')
        const { deleteICloudEvent } = await import('@/lib/ical')
        await deleteICloudEvent(
          calendar.appleId,
          decrypt(calendar.passwordEnc),
          stop.icloudEventUrl,
        )
      } catch { /* non-fatal */ }
    }
  }

  await prisma.stop.delete({ where: { id } })
  revalidatePath('/itinerary')
}

/** Delete a single occurrence or this-and-following from a recurring series. */
export async function deleteStopOccurrence(data: {
  masterId: string
  occurrenceDate: Date
  scope: RecurrenceScope
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const wayfarerId = session.user.id

  const master = await prisma.stop.findFirst({ where: { id: data.masterId, wayfarerId } })
  if (!master) return

  if (data.scope === 'one') {
    // Add the occurrence date to exception list — skips it during expansion
    const existing: string[] = master.exceptionDates ? JSON.parse(master.exceptionDates) : []
    const dateKey = toLocalDateKey(data.occurrenceDate)
    if (!existing.includes(dateKey)) {
      await prisma.stop.update({
        where: { id: master.id },
        data: { exceptionDates: JSON.stringify([...existing, dateKey]) },
      })
    }
  } else if (data.scope === 'future') {
    // Truncate recurrence to end before this occurrence
    const truncated = master.recurrenceRule
      ? truncateRRule(master.recurrenceRule, data.occurrenceDate)
      : null
    await prisma.stop.update({
      where: { id: master.id },
      data: { recurrenceRule: truncated },
    })
  } else {
    // 'all' — delete the master (cascade deletes exceptions)
    await deleteStop(master.id)
    return
  }

  revalidatePath('/itinerary')
}

export type ExternalCalendarEvent = {
  uid: string
  url: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  notes: string | null
  location: string | null
  color: string
  calendarId: string
  recurrenceRule: string | null
  readonly: boolean
}

/** Fetch all iCloud and subscription calendar events for the ±6 month window. */
export async function fetchExternalCalendarEvents(): Promise<ExternalCalendarEvent[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const wayfarerId = session.user.id

  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  const to = new Date()
  to.setMonth(to.getMonth() + 6)

  const [calendars, subscriptions, linkedStops] = await Promise.all([
    prisma.iCloudCalendar.findMany({ where: { wayfarerId } }),
    prisma.calendarSubscription.findMany({ where: { wayfarerId } }),
    prisma.stop.findMany({
      where: { wayfarerId, icloudEventUid: { not: null } },
      select: { icloudEventUid: true },
    }),
  ])

  const linkedUids = new Set(linkedStops.map(s => s.icloudEventUid).filter(Boolean))
  const results: ExternalCalendarEvent[] = []

  await Promise.all([
    ...calendars.map(async cal => {
      try {
        const { decrypt } = await import('@/lib/encrypt')
        const { fetchICloudEvents } = await import('@/lib/ical')
        const events = await fetchICloudEvents(
          cal.appleId, decrypt(cal.passwordEnc), cal.calendarUrl, from, to,
        )
        for (const e of events) {
          if (!linkedUids.has(e.uid)) {
            results.push({
              uid: e.uid, url: e.url, title: e.title,
              startDate: e.startDate, endDate: e.endDate, allDay: e.allDay,
              notes: e.notes, location: e.location,
              color: cal.color, calendarId: cal.id,
              recurrenceRule: e.recurrenceRule,
              readonly: false,
            })
          }
        }
      } catch { /* non-fatal per calendar */ }
    }),
    ...subscriptions.map(async sub => {
      try {
        const { fetchSubscriptionEvents } = await import('@/lib/ical')
        const events = await fetchSubscriptionEvents(sub.url, from, to)
        for (const e of events) {
          results.push({
            uid: `sub::${sub.id}::${e.uid}`, url: e.url, title: e.title,
            startDate: e.startDate, endDate: e.endDate, allDay: e.allDay,
            notes: e.notes, location: e.location,
            color: sub.color, calendarId: sub.id,
            recurrenceRule: e.recurrenceRule,
            readonly: true,
          })
        }
      } catch { /* non-fatal per subscription */ }
    }),
  ])

  return results
}

export async function deleteICloudEventDirect(calendarId: string, eventUrl: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const calendar = await prisma.iCloudCalendar.findFirst({
    where: { id: calendarId, wayfarerId: session.user.id },
  })
  if (!calendar) return

  const { decrypt } = await import('@/lib/encrypt')
  const { deleteICloudEvent } = await import('@/lib/ical')
  await deleteICloudEvent(calendar.appleId, decrypt(calendar.passwordEnc), eventUrl)

  revalidatePath('/itinerary')
}
