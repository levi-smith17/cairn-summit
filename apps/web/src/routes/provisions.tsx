import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ProvisionsClient } from './provisions/provisions-client'
import { getMarkers } from '@/lib/api/markers'

export default function Provisions() {
  const { user } = useAuth()

  const { data: markersData = [] } = useQuery({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user,
  })

  const markers = (markersData as any[]).map((m: any) => ({
    ...m,
    id: m.sk?.split('#').pop() ?? m.id,
  }))

  return <ProvisionsClient markers={markers} />
}
