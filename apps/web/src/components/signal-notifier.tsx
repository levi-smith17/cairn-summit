import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL
const POLL_INTERVAL_MS = 15_000

async function syncAndGetNewSignals(since: string) {
  try {
    const res = await fetch(`${API_BASE}/signals/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ since }),
    })
    if (!res.ok) return { ok: false }
    const json = await res.json()
    return { ok: true, ...(json.data ?? json) }
  } catch {
    return { ok: false }
  }
}

export function SignalNotifier() {
  const { pathname } = useLocation()
  const lastCheckedRef = useRef<string>(new Date().toISOString())
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const unreadCountRef = useRef(0)

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
      const since = lastCheckedRef.current
      lastCheckedRef.current = new Date().toISOString()

      const result = await syncAndGetNewSignals(since)
      if (!result.ok) return

      if (result.unreadCount !== undefined) {
        unreadCountRef.current = result.unreadCount
        const base = document.title.replace(/^\(\d+\)\s*/, '')
        document.title = result.unreadCount > 0 ? `(${result.unreadCount}) ${base}` : base
      }

      if (!result.signals?.length) return
      if (pathnameRef.current.startsWith('/signals')) return
      if (Notification.permission !== 'granted') return

      for (const signal of result.signals) {
        const n = new Notification(signal.senderName ?? 'New message', {
          body: signal.body.slice(0, 120),
          icon: '/favicon.svg',
          tag: signal.id,
        })
        const signalId = signal.id
        n.onclick = () => {
          window.focus()
          window.location.href = `/signals?tab=signals&signal=${signalId}`
        }
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return null
}
