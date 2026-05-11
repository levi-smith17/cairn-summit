import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getGuide, getMarkers } from '@/lib/api/guides'
import { GuidePassClient } from './guide-pass-client'

export default function GuideTraverse() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const guideIds = (searchParams.get('guides') ?? '').split(',').filter(Boolean)

    const guideQueries = guideIds.map(id => ({
        queryKey: ['guide', id],
        queryFn: () => getGuide(id),
        enabled: !!user && guideIds.length >= 2
    }))

    const { data: markers = [], isLoading: markersLoading } = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user
    })

    // Fetch all guides individually — simple approach for the stub era
    const { data: guide0 } = useQuery(guideQueries[0] ?? { queryKey: ['noop'], queryFn: async () => null, enabled: false })
    const { data: guide1 } = useQuery(guideQueries[1] ?? { queryKey: ['noop2'], queryFn: async () => null, enabled: false })
    const extraGuides = guideIds.slice(2)

    if (guideIds.length < 2) {
        navigate('/guides')
        return null
    }

    if (!guide0 || !guide1 || markersLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    const allStones = [
        ...(guide0.stones ?? []),
        ...(guide1.stones ?? []),
    ]

    const title = extraGuides.length === 0
        ? `${guide0.name} · ${guide1.name}`
        : `${guide0.name} · ${guide1.name} +${extraGuides.length} more`

    return (
        <GuidePassClient
            title={title}
            stones={allStones}
            allMarkers={markers}
            backUrl="/guides"
            guideIds={guideIds}
        />
    )
}
