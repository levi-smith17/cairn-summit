'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { syncAllAndGetNewSignals } from '@/actions/signals'

const POLL_INTERVAL_MS = 15_000

export function SignalNotifier() {
  const router = useRouter()
  const pathname = usePathname()
  const lastCheckedRef = useRef<string>(new Date().toISOString())
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  // Track the last known unread count so the MutationObserver can reapply it
  // whenever Next.js overwrites document.title (e.g. on router.refresh()).
  const unreadCountRef = useRef(0)

  // Re-apply the count badge every second in case Next.js (router.refresh or
  // navigation) has overwritten document.title without our prefix.
  useEffect(() => {
    const id = setInterval(() => {
      const count = unreadCountRef.current
      if (count > 0 && !document.title.startsWith('(')) {
        document.title = `(${count}) ${document.title}`
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    async function check() {
      // Always advance the timestamp so we never re-notify about signals
      // the user already saw while on the Signals page.
      const since = lastCheckedRef.current
      lastCheckedRef.current = new Date().toISOString()

      const result = await syncAllAndGetNewSignals(since)
      if (!result.ok) return

      // Update the unread count ref and apply to the title immediately.
      if (result.unreadCount !== undefined) {
        unreadCountRef.current = result.unreadCount
        const base = document.title.replace(/^\(\d+\)\s*/, '')
        document.title = result.unreadCount > 0 ? `(${result.unreadCount}) ${base}` : base
      }

      // Refresh the current page so server components pick up the synced
      // data: new emails in the list, updated unread counts, Basecamp panel, etc.
      router.refresh()

      // Fire a browser notification for new contact-form signals only when
      // the user isn't already watching the inbox.
      if (!result.signals?.length) return
      if (pathnameRef.current.startsWith('/signals')) return
      if (Notification.permission !== 'granted') return

      for (const signal of result.signals) {
        const n = new Notification(signal.senderName ?? 'New message', {
          body: signal.body.slice(0, 120),
          icon: '/favicon.ico',
          tag: signal.id,
        })
        const signalId = signal.id
        n.onclick = () => {
          window.focus()
          router.push(`/signals?tab=signals&signal=${signalId}`)
        }
      }
    }

    check() // run immediately on mount so the count shows before the first interval fires
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return null
}
