import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { WaypointsClient } from './waypoints/waypoints-client'
import { getWaypoints } from '@/lib/api/waypoints'
import { getTrails } from '@/lib/api/trails'
import { getMarkers } from '@/lib/api/markers'

export default function Waypoints() {
    const { user } = useAuth()

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

    const waypoints = (waypointsData ?? []).map((w: any) => ({
        ...w,
        id: w.sk?.split('#').pop() ?? w.id,
    }))

    const trails = (trailsData ?? []).map((t: any) => ({
        ...t,
        id: t.sk?.split('#').pop() ?? t.id,
    }))

    const markers = (markersData ?? []).map((m: any) => ({
        ...m,
        id: m.sk?.split('#').pop() ?? m.id,
    }))

    if (loadingW) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return (
        <WaypointsClient
            waypoints={waypoints}
            trails={trails}
            markers={markers}
            totalCount={waypoints.length}
            currentPage={1}
            waypointsPerPage={25}
        />
    )
}