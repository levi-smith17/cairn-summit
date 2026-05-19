import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { LogsClient } from './logs/logs-client'
import { getLogs } from '@/lib/api/logs'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'
import { getWaypoints } from '@/lib/api/waypoints'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'

export default function Logs() {
    const { user } = useAuth()
    const { terms } = useTerminology()

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['logs', user?.id],
        queryFn: getLogs,
        enabled: !!user
    })

    const { data: trailsData } = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })

    const { data: markersData } = useQuery({
        queryKey: ['markers', user?.id],
        queryFn: getMarkers,
        enabled: !!user
    })

    const { data: waypointsData } = useQuery({
        queryKey: ['waypoints', user?.id],
        queryFn: getWaypoints,
        enabled: !!user
    })

    const trails = (trailsData ?? []).map((t: any) => ({
        ...t,
        id: t.sk?.split('#').pop() ?? t.id,
    }))

    const logs = (logsData ?? []).map((l: any) => {
        const trailId = l.trailId ?? null
        const trailObj = trailId ? trails.find((t: any) => t.id === trailId) ?? null : null
        return {
            ...l,
            id: l.sk?.split('#').pop() ?? l.id,
            trailId,
            trail: trailObj ? { id: trailObj.id, name: trailObj.name } : null,
            markers: (l.markers ?? []).map((m: any) => ({
                markerId: m.id ?? m.markerId,
                marker: {
                    id: m.id ?? m.markerId,
                    name: m.name,
                    color: m.color,
                    icon: m.icon ?? null,
                }
            }))
        }
    })

    const markers = (markersData ?? []).map((m: any) => ({
        ...m,
        id: m.sk?.split('#').pop() ?? m.id,
    }))

    const waypoints = (waypointsData ?? []).map((w: any) => ({
        ...w,
        id: w.sk?.split('#').pop() ?? w.id,
    }))

    if (isLoading) return <PageSkeleton title={terms.logs} hasFilterBar />

    return (
        <LogsClient
            logs={logs}
            trails={trails}
            waypoints={waypoints}
            markers={markers}
            logsPerPage={25}
        />
    )
}