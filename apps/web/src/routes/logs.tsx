import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { LogsClient } from './logs/logs-client'
import { getLogs, getTrails, getMarkers, getWaypoints } from '@/lib/api/logs'

export default function Logs() {
    const { user } = useAuth()

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['logs', user?.id],
        queryFn: getLogs,
        enabled: !!user
    })

    const { data: trails = [] } = useQuery({
        queryKey: ['trails'],
        queryFn: getTrails,
        enabled: !!user
    })

    const { data: markers = [] } = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user
    })

    const { data: waypoints = [] } = useQuery({
        queryKey: ['waypoints'],
        queryFn: getWaypoints,
        enabled: !!user
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return (
        <LogsClient
            logs={logs}
            trails={trails}
            waypoints={waypoints}
            markers={markers}
            totalCount={logs.length}
            currentPage={1}
            logsPerPage={25}
        />
    )
}
