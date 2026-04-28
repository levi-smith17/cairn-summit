'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function syncAllAndGetNewSignals(since: string): Promise<{
  ok: boolean
  signals?: { id: string; senderName: string; body: string }[]
  unreadCount?: number
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const wayfarerId = session.user.id

  try {
    const [signals, unreadCount] = await Promise.all([
      prisma.signal.findMany({
        where: { wayfarerId, createdAt: { gt: new Date(since) } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, senderName: true, body: true },
      }),
      prisma.signal.count({ where: { wayfarerId, read: false } }),
    ])

    return { ok: true, signals, unreadCount }
  } catch {
    return { ok: false, error: 'Sync failed' }
  }
}
