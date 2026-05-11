import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { WaypointsClient } from './waypoints/waypoints-client'
import { getWaypoints, getTrails, getMarkers } from '@/lib/api/waypoints'

export default function Waypoints() {
    const { user } = useAuth()

    const { data: waypoints = [], isLoading: loadingW } = useQuery({
        queryKey: ['waypoints', user?.id],
        queryFn: getWaypoints,
        enabled: !!user
    })

    const { data: trails = [] } = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })

    const { data: markers = [] } = useQuery({
        queryKey: ['markers', user?.id],
        queryFn: getMarkers,
        enabled: !!user
    })

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
