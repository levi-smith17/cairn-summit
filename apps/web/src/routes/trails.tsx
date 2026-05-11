import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { TrailsClient } from './trails/trails-client'
import { getTrails } from '@/lib/api/trails'

export default function Trails() {
    const { user } = useAuth()
    const { data: trails = [], isLoading } = useQuery({
        queryKey: ['trails', user?.id],
        queryFn: getTrails,
        enabled: !!user
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )

    return <TrailsClient trails={trails} />
}
