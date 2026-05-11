import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { GuidesClient } from './guides/guides-client'
import { getGuides, getTrails, getMarkers } from '@/lib/api/guides'

export default function Guides() {
    const { user } = useAuth()
    const { data: guides = [], isLoading } = useQuery({
        queryKey: ['guides', user?.id],
        queryFn: getGuides,
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
