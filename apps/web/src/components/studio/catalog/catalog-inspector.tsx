import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrailsMarkersCatalog,
  type CatalogTab,
} from '@/components/studio/catalog/trails-markers-catalog'
import { useAuth } from '@/hooks/use-auth'
import { getMarkers } from '@/lib/api/markers'
import { getTrails } from '@/lib/api/trails'
import { extractId } from '@/lib/utils'

/**
 * Self-contained catalog inspector (Trails | Markers) for studio rails.
 * Fetches trails/markers and reuses TrailsMarkersCatalog for list + edit.
 */
export function CatalogInspector({
  initialTab = 'trails',
}: {
  onClose?: () => void
  initialTab?: CatalogTab
}) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const trailsQuery = useQuery({
    queryKey: ['trails', user?.id],
    queryFn: getTrails,
    enabled: !!user,
  })

  const markersQuery = useQuery({
    queryKey: ['markers', user?.id],
    queryFn: getMarkers,
    enabled: !!user,
  })

  const trails = useMemo(
    () =>
      (trailsQuery.data ?? []).map((t) => ({
        id: extractId(t.sk),
        name: t.name ?? '',
      })),
    [trailsQuery.data],
  )

  const markers = useMemo(
    () =>
      (markersQuery.data ?? [])
        .map((m) => ({
          id: extractId(m.sk),
          name: m.name ?? '',
          color: m.color ?? '#6b7280',
          icon: m.icon ?? null,
        }))
        .filter((m) => m.id && m.name),
    [markersQuery.data],
  )

  return (
    <TrailsMarkersCatalog
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        setSelectedId(null)
      }}
      trails={trails}
      markers={markers}
      selectedId={selectedId}
      onSelectId={setSelectedId}
      onClearSelection={() => setSelectedId(null)}
    />
  )
}

export type { CatalogTab }
