import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ProvisionsClient } from './provisions/provisions-client'
import { getMarkers } from '@/lib/api/provisions'

export default function Provisions() {
  const { user } = useAuth()

  const { data: markers = [] } = useQuery({
    queryKey: ['markers'],
    queryFn: getMarkers,
    enabled: !!user,
  })

  return <ProvisionsClient markers={markers} />
}
