import { useQuery } from '@tanstack/react-query'
import type { Marker } from '@cairn/types'
import { useAuth } from '@/hooks/use-auth'
import { MarkersClient } from './markers/markers-client'
import { getMarkers } from '@/lib/api/markers'
import { extractId } from '@/lib/utils'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'

export default function Markers() {
    const { user } = useAuth()
    const { terms } = useTerminology()

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

    if (isLoading) return <PageSkeleton title={terms.markers} hasFilterBar />

    return <MarkersClient markers={markers} />
}