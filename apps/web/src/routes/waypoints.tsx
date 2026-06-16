import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { WaypointsClient } from './waypoints/waypoints-client'
import { getWaypoints } from '@/lib/api/waypoints'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function Waypoints() {
    const { user } = useAuth()
    const { terms } = useTerminology()

    const waypointsQuery = useQuery({
        queryKey: ['waypoints', user?.id],
        queryFn: getWaypoints,
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

    if (isInitialRouteLoad([waypointsQuery, trailsQuery, markersQuery])) {
        return <PageSkeleton title={terms.waypoints} hasFilterBar />
    }

    const trailsData = trailsQuery.data
    const waypointsData = waypointsQuery.data
    const markersData = markersQuery.data

    const trails = (trailsData ?? []).map((t: any) => ({
        ...t,
        id: t.sk?.split('#').pop() ?? t.id,
    }))

    const waypoints = (waypointsData ?? []).map((w: any) => {
        const trailId = w.trailId ?? null
        const trailObj = trailId ? trails.find((t: any) => t.id === trailId) ?? null : null
        return {
            ...w,
            id: w.sk?.split('#').pop() ?? w.id,
            trailId,
            trail: trailObj ? { id: trailObj.id, name: trailObj.name } : null,
            markers: (w.markers ?? []).map((m: any) => ({
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

    return (
        <WaypointsClient
            waypoints={waypoints}
            trails={trails}
            markers={markers}
            waypointsPerPage={25}
        />
    )
}