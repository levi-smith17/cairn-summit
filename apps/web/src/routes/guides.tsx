import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { GuidesClient } from './guides/guides-client'
import { getGuides, getTrails, getMarkers } from '@/lib/api/guides'

export default function Guides() {
    const { user } = useAuth()
    const { data: guidesData = [], isLoading } = useQuery({
        queryKey: ['guides', user?.id],
        queryFn: getGuides,
        enabled: !!user
    })
    const { data: trailsData = [] } = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })
    const { data: markersData = [] } = useQuery({
        queryKey: ['markers', user?.id],
        queryFn: getMarkers,
        enabled: !!user
    })

    const trails = (trailsData as any[]).map((t: any) => ({
        ...t,
        id: t.sk?.split('#').pop() ?? t.id,
    }))

    const markers = (markersData as any[]).map((m: any) => ({
        ...m,
        id: m.sk?.split('#').pop() ?? m.id,
    }))

    const guides = (guidesData as any[]).map((g: any) => {
        const trailId = g.trailId ?? null
        const trailObj = trailId ? trails.find((t: any) => t.id === trailId) ?? null : null
        return {
            ...g,
            id: g.sk?.split('#').pop() ?? g.id,
            trailId,
            trail: trailObj ? { id: trailObj.id, name: trailObj.name } : null,
            stones: (g.stones ?? []).map((s: any) => ({
                ...s,
                id: s.id ?? s.sk?.split('#').pop(),
                markers: (s.markers ?? []).map((m: any) => ({
                    markerId: m.id ?? m.markerId,
                    marker: {
                        id: m.id ?? m.markerId,
                        name: m.name,
                        color: m.color,
                        icon: m.icon ?? null,
                    }
                }))
            }))
        }
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return (
        <GuidesClient
            guides={guides}
            trails={trails}
            markers={markers}
            totalCount={guides.length}
            currentPage={1}
            pageSize={25}
        />
    )
}
