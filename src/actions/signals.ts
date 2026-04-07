'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { syncEmails } from './email'

/**
 * Syncs all IMAP accounts (INBOX) for the current user, then returns any
 * contact-form signals that arrived after `since`. Called by SignalNotifier
 * every 15 seconds to keep the whole app up to date without manual interaction.
 */
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
    // Pull fresh email headers from every IMAP account into the local cache.
    const accounts = await prisma.imapAccount.findMany({
      where: { wayfarerId },
      select: { id: true },
    })
    await Promise.all(accounts.map(a => syncEmails(a.id, 'INBOX')))

    // Check for new contact-form signals and total unread counts in parallel.
    const [signals, unreadSignals, unreadEmails] = await Promise.all([
      prisma.signal.findMany({
        where: { wayfarerId, createdAt: { gt: new Date(since) } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, senderName: true, body: true },
      }),
      prisma.signal.count({ where: { wayfarerId, read: false } }),
      prisma.cachedEmail.count({
        where: { account: { wayfarerId }, isRead: false, mailbox: 'INBOX' },
      }),
    ])

    return { ok: true, signals, unreadCount: unreadSignals + unreadEmails }
  } catch {
    return { ok: false, error: 'Sync failed' }
  }
}
