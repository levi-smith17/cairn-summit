import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { getFacilitiesPageData } from '@/lib/api/starfield'
import { FacilitiesClient } from './facilities-client'

export default function StarfieldFacilities() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['starfield-facilities'],
    queryFn: getFacilitiesPageData,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['starfield-facilities'] })
  }

  return (
    <FacilitiesClient
      facilities={data?.facilities ?? []}
      resources={data?.resources ?? []}
      systems={data?.systems ?? []}
      onRefresh={onRefresh}
    />
  )
}
