import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { fetchStarfieldData } from '@/lib/api/starfield'
import { StarfieldClient } from './starfield/starfield-client'
import { StarfieldSkeleton } from '@/components/ui/page-skeleton'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

export default function Starfield() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const starfieldQuery = useQuery({
    queryKey: ['starfield'],
    queryFn: fetchStarfieldData,
    enabled: !!user,
  })

  if (isInitialRouteLoad([starfieldQuery])) {
    return <StarfieldSkeleton title="Starfield" />
  }

  const data = starfieldQuery.data

  return (
    <StarfieldClient
      networks={data?.networks ?? []}
      outposts={data?.outposts ?? []}
      resources={data?.resources ?? []}
      resourceTypes={data?.resourceTypes ?? []}
      systems={data?.systems ?? []}
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['starfield'] })}
    />
  )
}
