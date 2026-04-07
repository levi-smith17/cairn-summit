'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getAccountForUser(accountId: string, wayfarerId: string) {
  return prisma.imapAccount.findFirst({
    where: { id: accountId, wayfarerId },
  })
}

function imapCfg(account: { imapHost: string; imapPort: number; imapSecure: boolean; username: string }, password: string) {
  return {
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    username: account.username,
    password,
  }
}

function smtpCfg(account: { smtpHost: string; smtpPort: number; smtpSecure: boolean; username: string }, password: string) {
  return {
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    username: account.username,
    password,
  }
}

/** Fetch a cached email and verify the caller owns the linked account. */
async function getEmailWithAccount(emailId: string, wayfarerId: string) {
  const cached = await prisma.cachedEmail.findUnique({ where: { id: emailId } })
  if (!cached) return null
  const account = await prisma.imapAccount.findFirst({
    where: { id: cached.accountId, wayfarerId },
  })
  if (!account) return null
  return { cached, account }
}

// ── Folder listing ───────────────────────────────────────────────────────────

export async function getMailboxes(accountId: string): Promise<{ ok: boolean; mailboxes?: string[]; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const account = await getAccountForUser(accountId, session.user.id)
  if (!account) return { ok: false, error: 'Account not found' }

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { listMailboxes } = await import('@/lib/imap')
    const mailboxes = await listMailboxes(imapCfg(account, decrypt(account.passwordEnc)))
    return { ok: true, mailboxes }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to list mailboxes' }
  }
}

// ── Sync (fetch headers from IMAP → upsert cache) ───────────────────────────

export async function syncEmails(
  accountId: string,
  mailbox: string,
  page: number = 1,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const account = await getAccountForUser(accountId, session.user.id)
  if (!account) return { ok: false, error: 'Account not found' }

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { fetchEmailHeaders } = await import('@/lib/imap')
    const headers = await fetchEmailHeaders(
      imapCfg(account, decrypt(account.passwordEnc)),
      mailbox,
      page,
      50,
    )

    for (const h of headers) {
      await prisma.cachedEmail.upsert({
        where: { accountId_mailbox_uid: { accountId, mailbox, uid: h.uid } },
        update: {
          messageId:      h.messageId,
          inReplyTo:      h.inReplyTo,
          subject:        h.subject,
          fromName:       h.fromName,
          fromAddress:    h.fromAddress,
          toAddresses:    h.toAddresses,
          ccAddresses:    h.ccAddresses,
          date:           h.date,
          snippet:        h.snippet,
          hasAttachments: h.hasAttachments,
          isRead:         h.flags.includes('\\Seen'),
          isStarred:      h.flags.includes('\\Flagged'),
        },
        create: {
          accountId,
          mailbox,
          uid:            h.uid,
          messageId:      h.messageId,
          inReplyTo:      h.inReplyTo,
          subject:        h.subject,
          fromName:       h.fromName,
          fromAddress:    h.fromAddress,
          toAddresses:    h.toAddresses,
          ccAddresses:    h.ccAddresses,
          date:           h.date,
          snippet:        h.snippet,
          hasAttachments: h.hasAttachments,
          isRead:         h.flags.includes('\\Seen'),
          isStarred:      h.flags.includes('\\Flagged'),
        },
      })
    }

    revalidatePath('/signals')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sync failed' }
  }
}

// ── Fetch full body on demand ────────────────────────────────────────────────

export async function fetchEmailBody(emailId: string): Promise<{
  ok: boolean
  bodyHtml?: string | null
  bodyText?: string | null
  attachmentMeta?: { filename: string; contentType: string; size: number }[]
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return { ok: false, error: 'Email not found' }
  const { cached, account } = row

  // Return from cache if already fetched
  if (cached.bodyFetched) {
    return {
      ok: true,
      bodyHtml: cached.bodyHtml,
      bodyText: cached.bodyText,
      attachmentMeta: (cached.attachmentMeta as { filename: string; contentType: string; size: number }[] | null) ?? [],
    }
  }

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { fetchEmailBodyByUid } = await import('@/lib/imap')
    const body = await fetchEmailBodyByUid(
      imapCfg(account, decrypt(account.passwordEnc)),
      cached.mailbox,
      cached.uid,
    )

    await prisma.cachedEmail.update({
      where: { id: emailId },
      data: {
        bodyHtml:       body.bodyHtml,
        bodyText:       body.bodyText,
        attachmentMeta: body.attachmentMeta,
        bodyFetched:    true,
        isRead:         true,
      },
    })

    return { ok: true, bodyHtml: body.bodyHtml, bodyText: body.bodyText, attachmentMeta: body.attachmentMeta }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to fetch body' }
  }
}

// ── Mark read/unread ─────────────────────────────────────────────────────────

export async function markEmailRead(emailId: string, read: boolean) {
  const session = await auth()
  if (!session?.user?.id) return

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return
  const { cached, account } = row

  await prisma.cachedEmail.update({ where: { id: emailId }, data: { isRead: read } })

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { setEmailFlags } = await import('@/lib/imap')
    await setEmailFlags(
      imapCfg(account, decrypt(account.passwordEnc)),
      cached.mailbox,
      cached.uid,
      { seen: read },
    )
  } catch { /* non-fatal */ }

  revalidatePath('/signals')
}

// ── Star / unstar ────────────────────────────────────────────────────────────

export async function starEmail(emailId: string, starred: boolean) {
  const session = await auth()
  if (!session?.user?.id) return

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return
  const { cached, account } = row

  await prisma.cachedEmail.update({ where: { id: emailId }, data: { isStarred: starred } })

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { setEmailFlags } = await import('@/lib/imap')
    await setEmailFlags(
      imapCfg(account, decrypt(account.passwordEnc)),
      cached.mailbox,
      cached.uid,
      { flagged: starred },
    )
  } catch { /* non-fatal */ }

  revalidatePath('/signals')
}

// ── Delete email ─────────────────────────────────────────────────────────────

export async function deleteEmail(emailId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return
  const { cached, account } = row

  await prisma.cachedEmail.delete({ where: { id: emailId } })

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { deleteEmailByUid } = await import('@/lib/imap')
    await deleteEmailByUid(
      imapCfg(account, decrypt(account.passwordEnc)),
      cached.mailbox,
      cached.uid,
    )
  } catch { /* non-fatal */ }

  revalidatePath('/signals')
}

// ── Archive email ────────────────────────────────────────────────────────────

export async function archiveEmail(emailId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return
  const { cached, account } = row

  // Common archive folder names — try each until one works
  const archiveFolders = ['Archive', '[Gmail]/All Mail', 'INBOX.Archive', 'Archived']

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { moveEmailByUid, listMailboxes } = await import('@/lib/imap')
    const cfg = imapCfg(account, decrypt(account.passwordEnc))

    const mailboxes = await listMailboxes(cfg)
    const target = archiveFolders.find(f => mailboxes.some(m => m.toLowerCase() === f.toLowerCase()))
      ?? 'Archive'

    await moveEmailByUid(cfg, cached.mailbox, cached.uid, target)
    await prisma.cachedEmail.delete({ where: { id: emailId } })
  } catch { /* non-fatal */ }

  revalidatePath('/signals')
}

// ── Move email ───────────────────────────────────────────────────────────────

export async function moveEmail(emailId: string, targetMailbox: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const row = await getEmailWithAccount(emailId, session.user.id)
  if (!row) return
  const { cached, account } = row

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { moveEmailByUid } = await import('@/lib/imap')
    await moveEmailByUid(
      imapCfg(account, decrypt(account.passwordEnc)),
      cached.mailbox,
      cached.uid,
      targetMailbox,
    )
    // Remove from cache (will be re-synced in target mailbox)
    await prisma.cachedEmail.delete({ where: { id: emailId } })
  } catch { /* non-fatal */ }

  revalidatePath('/signals')
}

// ── Send email ───────────────────────────────────────────────────────────────

export async function sendEmailAction(data: {
  accountId: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  inReplyTo?: string | null
  references?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const account = await getAccountForUser(data.accountId, session.user.id)
  if (!account) return { ok: false, error: 'Account not found' }

  try {
    const { decrypt } = await import('@/lib/encrypt')
    const { sendEmail, appendToSentFolder } = await import('@/lib/imap')
    const password = decrypt(account.passwordEnc)

    const rawMessage = await sendEmail(smtpCfg(account, password), {
      from: account.emailAddress,
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      html: data.html,
      inReplyTo: data.inReplyTo,
      references: data.references,
    })

    // APPEND the sent message to the IMAP Sent folder — non-fatal if it fails.
    try {
      await appendToSentFolder(imapCfg(account, password), rawMessage)
    } catch { /* non-fatal */ }

    revalidatePath('/signals')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed' }
  }
}
