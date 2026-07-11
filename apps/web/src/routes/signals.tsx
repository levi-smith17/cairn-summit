import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getSignals } from '@/lib/api/signals'
import { getSettings } from '@/lib/api/settings'
import { SignalsStudioSkeleton } from '@/components/studio/ui/studio-skeletons'
import { SignalsClient } from './signals/signals-client'

const DEFAULT_SIGNAL_SETTINGS = {
  messagesPerPage: 25,
  autoMarkRead: true,
  autoRefreshInterval: 15,
  compactView: false,
  showSnippets: true,
  browserNotifications: false,
  notificationSound: true,
}

export default function Signals() {
  const { user } = useAuth()

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['signals', user?.id],
    queryFn: getSignals,
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: !!user,
  })

  if (signalsLoading || settingsLoading) return <SignalsStudioSkeleton />

  return (
    <SignalsClient
      signals={signals}
      signalSettings={{ ...DEFAULT_SIGNAL_SETTINGS, ...(settings?.signals ?? {}) }}
    />
  )
}
