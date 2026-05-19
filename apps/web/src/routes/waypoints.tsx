import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { WaypointsClient } from './waypoints/waypoints-client'
import { getWaypoints } from '@/lib/api/waypoints'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'

export default function Waypoints() {
    const { user } = useAuth()
    const { terms } = useTerminology()

    const { data: waypointsData, isLoading: loadingW } = useQuery({
        queryKey: ['waypoints', user?.id],
        queryFn: getWaypoints,
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

    if (loadingW) return <PageSkeleton title={terms.waypoints} hasFilterBar />

    return (
        <WaypointsClient
            waypoints={waypoints}
            trails={trails}
            markers={markers}
            waypointsPerPage={25}
        />
    )
}