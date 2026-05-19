import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ProvisionsClient } from './provisions/provisions-client'
import { getMarkers } from '@/lib/api/markers'
import { ProvisionsSkeleton } from '@/components/ui/page-skeleton'
import { useTerminology } from '@/contexts/terminology-context'

export default function Provisions() {
  const { user } = useAuth()
  const { terms } = useTerminology()

  const { data: markersData = [], isLoading } = useQuery({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user,
  })

  const markers = (markersData as any[]).map((m: any) => ({
    ...m,
    id: m.sk?.split('#').pop() ?? m.id,
  }))

  if (isLoading) return <ProvisionsSkeleton title={terms.provisions} />

  return <ProvisionsClient markers={markers} />
}
