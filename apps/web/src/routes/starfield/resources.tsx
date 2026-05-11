import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getResourcesPageData } from '@/lib/api/starfield'
import { ResourcesClient } from './resources-client'

const PAGE_SIZE = 25

export default function StarfieldResources() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const { data } = useQuery({
    queryKey: ['starfield-resources', page],
    queryFn: () => getResourcesPageData(page, PAGE_SIZE),
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['starfield-resources'] })
  }

  return (
    <ResourcesClient
      resources={data?.resources ?? []}
      resourceTypes={data?.resourceTypes ?? []}
      totalCount={data?.totalCount ?? 0}
      currentPage={page}
      pageSize={PAGE_SIZE}
      onRefresh={onRefresh}
    />
  )
}
