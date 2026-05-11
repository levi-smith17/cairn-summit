import { useQuery } from '@tanstack/react-query'
import type { Marker } from '@cairn/types'
import { useAuth } from '@/hooks/use-auth'
import { MarkersClient } from './markers/markers-client'
import { getMarkers } from '@/lib/api/markers'
import { extractId } from '@/lib/utils'

export default function Markers() {
    const { user } = useAuth()

    const { data, isLoading } = useQuery<Marker[]>({
        queryKey: ['markers', user?.id],
        queryFn: getMarkers,
        enabled: !!user
    })

    const markers = (data ?? []).map(m => ({
        id: extractId(m.sk),
        name: m.name,
        color: m.color,
        icon: m.icon ?? null,
        _count: { waypoints: 0 },
    }))

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return <MarkersClient markers={markers} />
}