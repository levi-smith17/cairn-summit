// Needs to be rewritten to support WebSocket notifications (polling removed).

//import { getAuthHeaders } from '@/lib/api/auth-headers'
import { useEffect } from 'react'

export function SignalNotifier() {
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return null
}
