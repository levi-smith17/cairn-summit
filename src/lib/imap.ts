/**
 * IMAP / SMTP utility functions.
 * All functions are server-only (called from Server Actions).
 */

import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'

export interface ImapConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}

export interface EmailHeader {
  uid: string
  messageId: string | null
  inReplyTo: string | null
  subject: string | null
  fromName: string | null
  fromAddress: string
  toAddresses: string[]
  ccAddresses: string[]
  date: Date | null
  snippet: string | null
  hasAttachments: boolean
  flags: string[]
}

export interface EmailBody {
  bodyHtml: string | null
  bodyText: string | null
  attachmentMeta: { filename: string; contentType: string; size: number }[]
}

function makeClient(cfg: ImapConfig) {
  return new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.username, pass: cfg.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  })
}

export async function testImapConnection(cfg: ImapConfig): Promise<void> {
  const client = makeClient(cfg)
  await client.connect()
  await client.logout()
}

export async function listMailboxes(cfg: ImapConfig): Promise<string[]> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    const list = await client.list()
    return list.map(m => m.path).sort()
  } finally {
    await client.logout()
  }
}

export async function fetchEmailHeaders(
  cfg: ImapConfig,
  mailbox: string,
  page: number,
  perPage: number,
): Promise<EmailHeader[]> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    const status = await client.mailboxOpen(mailbox)
    const total = status.exists

    if (total === 0) return []

    // Build sequence range for most-recent-first pagination
    const lastSeq = total - (page - 1) * perPage
    const firstSeq = Math.max(1, lastSeq - perPage + 1)
    if (lastSeq < 1) return []

    const range = `${firstSeq}:${lastSeq}`

    const results: EmailHeader[] = []

    for await (const msg of client.fetch(range, {
      uid: true,
      envelope: true,
      bodyStructure: true,
      flags: true,
      bodyParts: ['TEXT'],
    })) {
      const env = msg.envelope
      const fromAddr = env?.from?.[0]

      const hasAttachments = (() => {
        function checkStructure(bs: typeof msg.bodyStructure): boolean {
          if (!bs) return false
          if (bs.type === 'multipart') {
            return (bs.childNodes ?? []).some(checkStructure)
          }
          return bs.disposition === 'attachment' || bs.disposition === 'ATTACHMENT'
        }
        return checkStructure(msg.bodyStructure)
      })()

      // Build a plain-text snippet from TEXT bodypart
      let snippet: string | null = null
      const textPart = msg.bodyParts?.get('TEXT')
      if (textPart) {
        const raw = textPart.toString().slice(0, 500)
        snippet = raw.replace(/\s+/g, ' ').trim().slice(0, 200) || null
      }

      results.push({
        uid: String(msg.uid),
        messageId: env?.messageId ?? null,
        inReplyTo: env?.inReplyTo ?? null,
        subject: env?.subject ?? null,
        fromName: fromAddr?.name || null,
        fromAddress: fromAddr?.address ?? '',
        toAddresses: (env?.to ?? []).map(a => a.address).filter(Boolean) as string[],
        ccAddresses: (env?.cc ?? []).map(a => a.address).filter(Boolean) as string[],
        date: env?.date ?? null,
        snippet,
        hasAttachments,
        flags: [...(msg.flags ?? [])],
      })
    }

    // Return most-recent first
    return results.reverse()
  } finally {
    await client.logout()
  }
}

export async function fetchEmailBodyByUid(
  cfg: ImapConfig,
  mailbox: string,
  uid: string,
): Promise<EmailBody> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    await client.mailboxOpen(mailbox)
    const download = await client.download(uid, undefined, { uid: true })
    const parsed = await simpleParser(download.content)

    const attachmentMeta = (parsed.attachments ?? []).map(a => ({
      filename: a.filename ?? 'attachment',
      contentType: a.contentType,
      size: a.size ?? 0,
    }))

    return {
      bodyHtml: parsed.html || null,
      bodyText: parsed.text || null,
      attachmentMeta,
    }
  } finally {
    await client.logout()
  }
}

export async function setEmailFlags(
  cfg: ImapConfig,
  mailbox: string,
  uid: string,
  flags: { seen?: boolean; flagged?: boolean },
): Promise<void> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    await client.mailboxOpen(mailbox)
    if (flags.seen !== undefined) {
      if (flags.seen) {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
      } else {
        await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true })
      }
    }
    if (flags.flagged !== undefined) {
      if (flags.flagged) {
        await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true })
      } else {
        await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true })
      }
    }
  } finally {
    await client.logout()
  }
}

export async function deleteEmailByUid(
  cfg: ImapConfig,
  mailbox: string,
  uid: string,
): Promise<void> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    await client.mailboxOpen(mailbox)
    await client.messageDelete(uid, { uid: true })
  } finally {
    await client.logout()
  }
}

export async function moveEmailByUid(
  cfg: ImapConfig,
  mailbox: string,
  uid: string,
  targetMailbox: string,
): Promise<void> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    await client.mailboxOpen(mailbox)
    await client.messageMove(uid, targetMailbox, { uid: true })
  } finally {
    await client.logout()
  }
}

export interface SendOptions {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  text?: string
  inReplyTo?: string | null
  references?: string | null
}

/** Send via SMTP and return the raw RFC 2822 message buffer for IMAP APPEND. */
export async function sendEmail(cfg: SmtpConfig, opts: SendOptions): Promise<Buffer> {
  // Port 465 → implicit TLS (secure: true).
  // Port 587 / 25 → STARTTLS (secure: false; TLS is negotiated after the plain handshake).
  // Other ports → honour whatever the user stored, but never force secure on a STARTTLS port.
  const useSecure = cfg.port === 465 ? true : cfg.port === 587 || cfg.port === 25 ? false : cfg.secure

  const mailOptions = {
    from: opts.from,
    to: opts.to.join(', '),
    cc: opts.cc?.join(', '),
    bcc: opts.bcc?.join(', '),
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    inReplyTo: opts.inReplyTo ?? undefined,
    references: opts.references ?? undefined,
  }

  // Capture the full RFC 2822 message before sending so we can APPEND it to the Sent folder.
  const streamTransport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true })
  const captured = await streamTransport.sendMail(mailOptions)
  const rawMessage = captured.message as Buffer

  // Send via SMTP.
  const smtpTransport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: useSecure,
    requireTLS: !useSecure,
    auth: { user: cfg.username, pass: cfg.password },
    tls: { rejectUnauthorized: false },
  })
  await smtpTransport.sendMail(mailOptions)

  return rawMessage
}

const SENT_FOLDER_NAMES = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'INBOX.Sent', 'INBOX/Sent']

/** APPEND the raw message to the IMAP Sent folder (marked \Seen). Non-fatal — callers should catch. */
export async function appendToSentFolder(cfg: ImapConfig, rawMessage: Buffer): Promise<void> {
  const client = makeClient(cfg)
  await client.connect()
  try {
    const mailboxes = await client.list()

    // Prefer the folder with the \Sent special-use attribute.
    let sentPath = mailboxes.find(m => m.specialUse === '\\Sent')?.path

    // Fall back to common name matching (case-insensitive).
    if (!sentPath) {
      const paths = mailboxes.map(m => m.path)
      sentPath = SENT_FOLDER_NAMES.find(name =>
        paths.some(p => p.toLowerCase() === name.toLowerCase())
      )
    }

    // Last resort: use 'Sent' and let the server create it if needed.
    if (!sentPath) sentPath = 'Sent'

    await client.append(sentPath, rawMessage, ['\\Seen'])
  } finally {
    await client.logout()
  }
}
