import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/contexts/terminology-context'
import { getGuide, getMarkers } from '@/lib/api/guides'
import { GuidePassClient } from './guide-pass-client'
import { GuidePassSkeleton } from '@/components/ui/page-skeleton'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function GuideTraverse() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { terms } = useTerminology()

    const guideIds = (searchParams.get('guides') ?? '').split(',').filter(Boolean)

    const guideQueries = useQueries({
        queries: guideIds.map(id => ({
            queryKey: ['guide', id],
            queryFn: () => getGuide(id),
            enabled: !!user && guideIds.length >= 2,
        })),
    })

    const markersQuery = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user,
    })

    if (guideIds.length < 2) {
        navigate('/guides')
        return null
    }

    if (isInitialRouteLoad([...guideQueries, markersQuery])) {
        return <GuidePassSkeleton title={terms.guides} />
    }

    const guides = guideQueries.map(query => query.data).filter(Boolean)

    if (guides.length < 2) {
        navigate('/guides')
        return null
    }

    const allStones = guides.flatMap(guide => guide.stones ?? [])
    const title = guides.length === 2
        ? `${guides[0].name} · ${guides[1].name}`
        : `${guides[0].name} · ${guides[1].name} +${guides.length - 2} more`

    return (
        <GuidePassClient
            title={title}
            stones={allStones}
            allMarkers={markersQuery.data ?? []}
            backUrl="/guides"
            guideIds={guideIds}
        />
    )
}
