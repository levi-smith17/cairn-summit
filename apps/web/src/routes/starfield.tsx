import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { fetchStarfieldData } from '@/lib/api/starfield'
import { StarfieldClient } from './starfield/starfield-client'

export default function Starfield() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['starfield'],
    queryFn: fetchStarfieldData,
    enabled: !!user,
  })

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
