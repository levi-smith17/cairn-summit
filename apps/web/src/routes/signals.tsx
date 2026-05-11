import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { SignalsClient } from './signals/signals-client'
import { getSignals, getSignalSettings } from '@/lib/api/signals'

const DEFAULT_SETTINGS = {
    messagesPerPage: 25,
    autoMarkRead: true,
    autoRefreshInterval: 0,
    compactView: false,
    showSnippets: true,
}

export default function Signals() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()

    const { data: signals = [], isLoading } = useQuery({
        queryKey: ['signals', user?.id],
        queryFn: getSignals,
        enabled: !!user
    })

    const { data: signalSettings = DEFAULT_SETTINGS } = useQuery({
        queryKey: ['signal-settings'],
        queryFn: getSignalSettings,
        enabled: !!user
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return (
        <SignalsClient
            signals={signals}
            initialSignalId={searchParams.get('id')}
            signalSettings={signalSettings}
        />
    )
}
