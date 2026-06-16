import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/contexts/terminology-context'
import { getGuide, getMarkers } from '@/lib/api/guides'
import { GuidePassClient } from './guide-pass-client'
import { GuidePassSkeleton } from '@/components/ui/page-skeleton'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function GuidePass() {
    const { guideId } = useParams<{ guideId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { terms } = useTerminology()

    const guideQuery = useQuery({
        queryKey: ['guide', guideId],
        queryFn: () => getGuide(guideId!),
        enabled: !!user && !!guideId
    })

    const markersQuery = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user
    })

    if (isInitialRouteLoad([guideQuery, markersQuery])) {
        return <GuidePassSkeleton title={terms.guides} />
    }

    const guide = guideQuery.data
    const markers = markersQuery.data ?? []

    if (!guide) {
        navigate('/guides')
        return null
    }

    return (
        <GuidePassClient
            title={guide.name}
            stones={guide.stones ?? []}
            allMarkers={markers}
            backUrl="/guides"
            guideIds={[guideId!]}
        />
    )
}
