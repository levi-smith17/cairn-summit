'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveAccountSettings(data: {
  username: string | null
  defaultTerminology: 'CAIRN' | 'STANDARD'
  defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  timeFormat: 'TWELVE' | 'TWENTYFOUR'
  listed: boolean
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
      timeFormat: data.timeFormat,
      listed: data.listed,
      customDomain: data.customDomain,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/manifest')
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

// ── IMAP Accounts ────────────────────────────────────────────────────────────

export async function testImapConnectionAction(data: {
  imapHost: string
  imapPort: number
  imapSecure: boolean
  username: string
  password: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { testImapConnection } = await import('@/lib/imap')
    await testImapConnection({
      host: data.imapHost,
      port: data.imapPort,
      secure: data.imapSecure,
      username: data.username,
      password: data.password,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' }
  }
}

export async function addImapAccount(data: {
  label: string
  emailAddress: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
  isDefault: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const { encrypt } = await import('@/lib/encrypt')
  const passwordEnc = encrypt(data.password)

  // If this is the default, unset any existing default
  if (data.isDefault) {
    await prisma.imapAccount.updateMany({
      where: { wayfarerId: session.user.id },
      data: { isDefault: false },
    })
  }

  await prisma.imapAccount.create({
    data: {
      label: data.label,
      emailAddress: data.emailAddress,
      imapHost: data.imapHost,
      imapPort: data.imapPort,
      imapSecure: data.imapSecure,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure,
      username: data.username,
      passwordEnc,
      isDefault: data.isDefault,
      wayfarerId: session.user.id,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/signals')
}

export async function updateImapAccount(id: string, data: {
  label: string
  emailAddress: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  isDefault: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const account = await prisma.imapAccount.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!account) return

  if (data.isDefault) {
    await prisma.imapAccount.updateMany({
      where: { wayfarerId: session.user.id, id: { not: id } },
      data: { isDefault: false },
    })
  }

  await prisma.imapAccount.update({
    where: { id },
    data: {
      label: data.label,
      emailAddress: data.emailAddress,
      imapHost: data.imapHost,
      imapPort: data.imapPort,
      imapSecure: data.imapSecure,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure,
      isDefault: data.isDefault,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/signals')
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

export async function deleteImapAccount(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const account = await prisma.imapAccount.findFirst({
    where: { id, wayfarerId: session.user.id },
  })
  if (!account) return

  await prisma.imapAccount.delete({ where: { id } })

  revalidatePath('/settings')
  revalidatePath('/signals')
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
