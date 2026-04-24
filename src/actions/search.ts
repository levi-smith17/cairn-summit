'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export type SearchResultType =
  | 'waypoint' | 'log' | 'provision' | 'stop'
  | 'trail' | 'marker' | 'signal' | 'email'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  /** App-internal navigation URL */
  url: string
  /** Waypoints only: the external URL of the bookmark */
  externalUrl?: string
  /** Markers only: hex color for the pill */
  color?: string
  score: number
}

function titleScore(text: string | null | undefined, q: string): number {
  if (!text) return 0
  const t = text.toLowerCase()
  const lq = q.toLowerCase()
  if (t === lq) return 100
  if (t.startsWith(lq)) return 80
  if (t.includes(lq)) return 60
  return 0
}

export async function globalSearch(
  query: string,
  deep: boolean,
): Promise<SearchResult[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const wayfarerId = session.user.id

  const q = query.trim()
  if (!q) return []

  const ci = { contains: q, mode: 'insensitive' as const }

  const [waypoints, logs, provisions, stops, trails, markers, signals, emails] = await Promise.all([
    // Waypoints
    prisma.waypoint.findMany({
      where: {
        wayfarerId,
        OR: deep ? [{ title: ci }, { url: ci }, { description: ci }, { notes: ci }] : [{ title: ci }],
      },
      select: { id: true, title: true, url: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),

    // Logs (no title field — always search content)
    prisma.log.findMany({
      where: { wayfarerId, content: ci },
      select: { id: true, content: true, createdAt: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),

    // Provisions
    prisma.provision.findMany({
      where: {
        wayfarerId,
        OR: deep ? [{ name: ci }, { notes: ci }] : [{ name: ci }],
      },
      select: { id: true, name: true, markers: { include: { marker: true }, take: 1 } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),

    // Stops
    prisma.stop.findMany({
      where: {
        wayfarerId,
        OR: deep ? [{ title: ci }, { notes: ci }, { location: ci }] : [{ title: ci }],
      },
      select: { id: true, title: true, startDate: true },
      take: 20,
      orderBy: { startDate: 'desc' },
    }),

    // Trails
    prisma.trail.findMany({
      where: {
        wayfarerId,
        name: ci,
      },
      select: { id: true, name: true },
      take: 20,
      orderBy: { name: 'asc' },
    }),

    // Markers
    prisma.marker.findMany({
      where: { wayfarerId, name: ci },
      select: { id: true, name: true, color: true },
      take: 20,
      orderBy: { name: 'asc' },
    }),

    // Signals (contact form messages)
    prisma.signal.findMany({
      where: {
        wayfarerId,
        OR: deep
          ? [{ senderName: ci }, { senderEmail: ci }, { body: ci }]
          : [{ senderName: ci }, { senderEmail: ci }],
      },
      select: { id: true, senderName: true, senderEmail: true, createdAt: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),

    // Cached emails
    prisma.cachedEmail.findMany({
      where: {
        account: { wayfarerId },
        OR: deep
          ? [{ subject: ci }, { fromName: ci }, { fromAddress: ci }, { snippet: ci }]
          : [{ subject: ci }, { fromName: ci }, { fromAddress: ci }],
      },
      select: {
        id: true, subject: true, fromName: true, fromAddress: true,
        date: true, accountId: true, mailbox: true,
      },
      take: 20,
      orderBy: { date: 'desc' },
    }),
  ])

  const results: SearchResult[] = []
  const lq = q.toLowerCase()

  for (const w of waypoints) {
    const ts = titleScore(w.title, q)
    results.push({
      id: w.id, type: 'waypoint',
      title: w.title,
      subtitle: w.url,
      url: `/waypoints?id=${w.id}`,
      externalUrl: w.url,
      score: ts || 30,
    })
  }

  for (const l of logs) {
    // Strip markdown-style headers/bold for display
    const snippet = l.content.replace(/[#*_`]/g, '').trim().slice(0, 80)
    // Score based on how early in the content the match appears
    const idx = l.content.toLowerCase().indexOf(lq)
    const sc = idx === 0 ? 80 : idx < 60 ? 60 : 30
    results.push({
      id: l.id, type: 'log',
      title: snippet || '(empty log)',
      subtitle: format(new Date(l.createdAt), 'MMM d, yyyy'),
      url: `/logs?id=${l.id}`,
      score: sc,
    })
  }

  for (const p of provisions) {
    const ts = titleScore(p.name, q)
    results.push({
      id: p.id, type: 'provision',
      title: p.name,
      subtitle: p.markers[0]?.marker?.name.split('/').pop() ?? "",
      url: `/provisions?id=${p.id}`,
      score: ts || 30,
    })
  }

  for (const s of stops) {
    const ts = titleScore(s.title, q)
    const date = new Date(s.startDate)
    results.push({
      id: s.id, type: 'stop',
      title: s.title,
      subtitle: format(date, 'MMM d, yyyy'),
      url: `/itinerary?date=${format(date, 'yyyy-MM')}`,
      score: ts || 30,
    })
  }

  for (const t of trails) {
    const ts = titleScore(t.name, q)
    results.push({
      id: t.id, type: 'trail',
      title: t.name,
      subtitle: 'Trail',
      url: `/trails?id=${t.id}`,
      score: ts || 30,
    })
  }

  for (const m of markers) {
    const ts = titleScore(m.name, q)
    results.push({
      id: m.id, type: 'marker',
      title: m.name,
      subtitle: 'Marker',
      url: `/markers?id=${m.id}`,
      color: m.color,
      score: ts || 30,
    })
  }

  for (const sig of signals) {
    const ts = titleScore(sig.senderName, q) || titleScore(sig.senderEmail, q)
    results.push({
      id: sig.id, type: 'signal',
      title: sig.senderName,
      subtitle: `${sig.senderEmail} · ${format(new Date(sig.createdAt), 'MMM d, yyyy')}`,
      url: `/signals?tab=signals&signal=${sig.id}`,
      score: ts || 30,
    })
  }

  for (const e of emails) {
    const ts = titleScore(e.subject, q) || titleScore(e.fromName, q) || titleScore(e.fromAddress, q)
    results.push({
      id: e.id, type: 'email',
      title: e.subject ?? '(no subject)',
      subtitle: `${e.fromName ?? e.fromAddress} · ${e.date ? format(new Date(e.date), 'MMM d, yyyy') : ''}`,
      url: `/signals?tab=email&account=${e.accountId}&folder=${e.mailbox}&email=${e.id}`,
      score: ts || 30,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}
