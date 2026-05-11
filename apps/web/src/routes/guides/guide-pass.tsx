import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getGuide, getMarkers } from '@/lib/api/guides'
import { GuidePassClient } from './guide-pass-client'

export default function GuidePass() {
    const { guideId } = useParams<{ guideId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const { data: guide, isLoading: guideLoading } = useQuery({
        queryKey: ['guide', guideId],
        queryFn: () => getGuide(guideId!),
        enabled: !!user && !!guideId
    })

    const { data: markers = [], isLoading: markersLoading } = useQuery({
        queryKey: ['markers'],
        queryFn: getMarkers,
        enabled: !!user
    })

    if (guideLoading || markersLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

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
