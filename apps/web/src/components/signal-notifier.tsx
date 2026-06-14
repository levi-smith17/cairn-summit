import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getSignals } from '@/lib/api/signals'
import { getSettings } from '@/lib/api/settings'

export function SignalNotifier() {
  const { user } = useAuth()
  const knownUnreadRef = useRef<number | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: !!user,
  })

  const refreshInterval = (settings?.signals?.autoRefreshInterval ?? 15) * 1000
  const browserNotifications = settings?.signals?.browserNotifications ?? false
  const notificationSound = settings?.signals?.notificationSound ?? true

  const { data: signals = [] } = useQuery({
    queryKey: ['signals', user?.id],
    queryFn: getSignals,
    enabled: !!user,
    refetchInterval: refreshInterval,
  })

  useEffect(() => {
    if (!user || !browserNotifications) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const unread = signals.filter(s => !s.read).length

    if (knownUnreadRef.current === null) {
      knownUnreadRef.current = unread
      return
    }

    if (unread > knownUnreadRef.current) {
      const newest = signals.find(s => !s.read)
      if (newest) {
        new Notification(`New message from ${newest.senderName}`, {
          body: newest.body.slice(0, 120),
          tag: `signal-${newest.id}`,
        })
        if (notificationSound) {
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            void audio.play()
          } catch {
            // optional asset
          }
        }
      }
    }

    knownUnreadRef.current = unread
  }, [signals, user, browserNotifications, notificationSound])

  return null
}
