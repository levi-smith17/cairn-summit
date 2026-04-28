'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveAccountSettings(data: {
  username: string | null
  defaultTerminology: 'CAIRN' | 'STANDARD'
  defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  customDomain: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  if (data.username) {
    const existing = await prisma.wayfarer.findUnique({ where: { username: data.username } })
    if (existing && existing.id !== session.user.id) throw new Error('Username already taken')
  }

  if (data.customDomain) {
    const existing = await prisma.wayfarer.findUnique({ where: { customDomain: data.customDomain } })
    if (existing && existing.id !== session.user.id) throw new Error('Custom domain already in use')
  }

  await prisma.wayfarer.update({
    where: { id: session.user.id },
    data: {
      username: data.username,
      defaultTerminology: data.defaultTerminology,
      defaultTheme: data.defaultTheme,
      customDomain: data.customDomain,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/manifest')
}

export async function updateListedSetting(listed: boolean) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.wayfarer.update({ where: { id: session.user.id }, data: { listed } })
  revalidatePath('/settings')
}

export async function updateTimeFormat(timeFormat: 'TWELVE' | 'TWENTYFOUR') {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.wayfarer.update({ where: { id: session.user.id }, data: { timeFormat } })
  revalidatePath('/settings')
}

export async function addICloudCalendar(data: {
  appleId: string
  password: string
  calendarName: string
  color: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const { encrypt } = await import('@/lib/encrypt')
  const { resolveCalendarUrl } = await import('@/lib/ical')

  const calendarUrl = await resolveCalendarUrl(data.appleId, data.password, data.calendarName)
  if (!calendarUrl) throw new Error(`Calendar "${data.calendarName}" not found. Check the name and try again.`)

  const passwordEnc = encrypt(data.password)

  await prisma.iCloudCalendar.create({
    data: {
      appleId: data.appleId,
      passwordEnc,
      calendarUrl,
      name: data.calendarName,
      color: data.color,
      wayfarerId: session.user.id,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

export async function updateICloudCalendar(id: string, data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const calendar = await prisma.iCloudCalendar.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!calendar) return

  await prisma.iCloudCalendar.update({
    where: { id },
    data: { name: data.name, color: data.color },
  })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

export async function deleteICloudCalendar(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const calendar = await prisma.iCloudCalendar.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!calendar) return

  await prisma.iCloudCalendar.delete({ where: { id } })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

// ── Signal Settings ──────────────────────────────────────────────────────────

export async function updateSignalSettings(data: {
  messagesPerPage?: number
  autoMarkRead?: boolean
  autoRefreshInterval?: number
  defaultView?: 'SIGNALS' | 'EMAIL'
  compactView?: boolean
  showSnippets?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.signalSettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })

  revalidatePath('/settings')
  revalidatePath('/signals')
}

// ── Appearance Settings ──────────────────────────────────────────────────────

export async function updateAppearanceSettings(data: {
  sidebarDefault: 'EXPANDED' | 'COLLAPSED'
  defaultLandingPage: string
  dateFormat: 'MDY' | 'DMY' | 'YMD'
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.appearanceSettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
}

// ── Notification Settings ────────────────────────────────────────────────────

export async function updateNotificationSettings(data: {
  browserNotifications: boolean
  notificationSound: boolean
  emailDigest: 'NEVER' | 'DAILY' | 'WEEKLY'
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.notificationSettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
}

// ── Privacy Settings ─────────────────────────────────────────────────────────

export async function updatePrivacySettings(data: {
  manifestVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  contactFormEnabled: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.privacySettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
}

// ── Itinerary Settings ───────────────────────────────────────────────────────

export async function updateItinerarySettings(data: {
  defaultView: 'MONTH' | 'WEEK' | 'DAY'
  firstDayOfWeek: 'SUNDAY' | 'MONDAY'
  defaultEventDuration: number
  showWeekNumbers: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.itinerarySettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

// ── Log Settings ─────────────────────────────────────────────────────────────

export async function updateLogSettings(data: {
  logsPerPage?: number
  defaultSort?: 'NEWEST' | 'OLDEST'
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.logSettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
  revalidatePath('/logs')
}

// ── Waypoint Settings ────────────────────────────────────────────────────────

export async function updateWaypointSettings(data: {
  defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
  openInNewTab: boolean
  waypointsPerPage: number
}) {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.waypointSettings.upsert({
    where:  { wayfarerId: session.user.id },
    update: data,
    create: { wayfarerId: session.user.id, ...data },
  })
  revalidatePath('/settings')
  revalidatePath('/waypoints')
}

// ── Calendar Subscriptions ───────────────────────────────────────────────────

export async function addCalendarSubscription(data: { name: string; url: string; color: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.calendarSubscription.create({
    data: { name: data.name, url: data.url, color: data.color, wayfarerId: session.user.id },
  })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

export async function updateCalendarSubscription(id: string, data: { name: string; color: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const sub = await prisma.calendarSubscription.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!sub) return

  await prisma.calendarSubscription.update({
    where: { id },
    data: { name: data.name, color: data.color },
  })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}

export async function deleteCalendarSubscription(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const sub = await prisma.calendarSubscription.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!sub) return

  await prisma.calendarSubscription.delete({ where: { id } })

  revalidatePath('/settings')
  revalidatePath('/itinerary')
}
