import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { TrailsClient } from './trails/trails-client'
import { getTrails } from '@/lib/api/trails'
import { extractId } from '@/lib/utils'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'

export default function Trails() {
    const { user } = useAuth()
    const { terms } = useTerminology()
    const { data, isLoading } = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })

    const trails = (data ?? []).map(t => ({
        id: extractId(t.sk),
        name: t.name,
        createdAt: t.createdAt,
    }))

    if (isLoading) return <PageSkeleton title={terms.trails} />

    return <TrailsClient trails={trails} />
}