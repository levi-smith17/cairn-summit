import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { LogsClient } from './logs/logs-client'
import { getLogs } from '@/lib/api/logs'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'
import { getWaypoints } from '@/lib/api/waypoints'
import { LogsStudioSkeleton } from '@/components/studio/ui/studio-skeletons'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function Logs() {
    const { user } = useAuth()

    const logsQuery = useQuery({
        queryKey: ['logs', user?.id],
        queryFn: getLogs,
        enabled: !!user
    })

    const trailsQuery = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })

    const markersQuery = useQuery({
        queryKey: ['markers', user?.id],
        queryFn: getMarkers,
        enabled: !!user
    })

    const waypointsQuery = useQuery({
        queryKey: ['waypoints', user?.id],
        queryFn: getWaypoints,
        enabled: !!user
    })

    if (isInitialRouteLoad([logsQuery, trailsQuery, markersQuery, waypointsQuery])) {
        return <LogsStudioSkeleton />
    }

    const logsData = logsQuery.data
    const trailsData = trailsQuery.data
    const markersData = markersQuery.data
    const waypointsData = waypointsQuery.data

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

    return (
        <LogsClient
            logs={logs}
            trails={trails}
            waypoints={waypoints}
            markers={markers}
        />    )
}