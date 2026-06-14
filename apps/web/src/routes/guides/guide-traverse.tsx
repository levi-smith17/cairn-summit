import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getGuide, getMarkers } from '@/lib/api/guides'
import { GuidePassClient } from './guide-pass-client'

export default function GuideTraverse() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const guideIds = (searchParams.get('guides') ?? '').split(',').filter(Boolean)

    const guideQueries = useQueries({
        queries: guideIds.map(id => ({
            queryKey: ['guide', id],
            queryFn: () => getGuide(id),
            enabled: !!user && guideIds.length >= 2,
        })),
    })

    const { data: markers = [], isLoading: markersLoading } = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user,
    })

    if (guideIds.length < 2) {
        navigate('/guides')
        return null
    }

    const guidesLoading = guideQueries.some(query => query.isLoading)
    const guides = guideQueries.map(query => query.data).filter(Boolean)

    if (guidesLoading || markersLoading || guides.length < 2) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    const allStones = guides.flatMap(guide => guide.stones ?? [])
    const title = guides.length === 2
        ? `${guides[0].name} · ${guides[1].name}`
        : `${guides[0].name} · ${guides[1].name} +${guides.length - 2} more`

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
