'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { FolderCard } from './folder-card'
import { WaypointDrawer } from '@/components/drawers/waypoint-drawer'
import { LogDrawer } from '@/components/drawers/log-drawer'
import { useMasonryColumns } from '@/hooks/use-masonry-columns'
import { useColumnCount } from '@/hooks/use-column-count'

interface DashboardClientProps {
  initialFolders: any[]
  initialHasMore: boolean
  tags: any[]
  folders: any[]
  filteredCountMap: Record<string, number> | null
}

export function DashboardClient({
  initialFolders,
  initialHasMore,
  tags,
  folders,
  filteredCountMap,
}: DashboardClientProps) {
  const searchParams = useSearchParams()
  const searchParamsStr = searchParams.toString()
  const [extraFolders, setExtraFolders] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevSearchParamsStr = useRef(searchParamsStr)

  // Waypoint drawer state
  const [waypointDrawerOpen, setWaypointDrawerOpen] = useState(false)
  const [editingWaypoint, setEditingWaypoint] = useState<any>(null)
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null)

  // Log drawer state
  const [logDrawerOpen, setLogDrawerOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<any>(null)
  const [defaultLogFolderId, setDefaultLogFolderId] = useState<string | null>(null)
  const [defaultWaypointId, setDefaultWaypointId] = useState<string | null>(null)

  // Reset extra pages when filters change
  if (prevSearchParamsStr.current !== searchParamsStr) {
    prevSearchParamsStr.current = searchParamsStr
    setExtraFolders([])
    setHasMore(initialHasMore)
    setPage(1)
  }

  const loadedFolders = [...initialFolders, ...extraFolders]

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', nextPage.toString())
      const res = await fetch(`/api/dashboard?${params.toString()}`)
      const data = await res.json()
      setExtraFolders(prev => [...prev, ...data.folders])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, searchParams])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  function handleAddWaypoint(folderId: string) {
    setEditingWaypoint(null)
    setDefaultFolderId(folderId)
    setWaypointDrawerOpen(true)
  }

  function handleEditWaypoint(waypoint: any) {
    setEditingWaypoint(waypoint)
    setDefaultFolderId(null)
    setWaypointDrawerOpen(true)
  }

  function handleAddLog(folderId: string, waypointId?: string) {
    setEditingLog(null)
    setDefaultLogFolderId(folderId)
    setDefaultWaypointId(waypointId ?? null)
    setLogDrawerOpen(true)
  }

  function handleEditLog(log: any) {
    setEditingLog(log)
    setDefaultLogFolderId(null)
    setDefaultWaypointId(null)
    setLogDrawerOpen(true)
  }

  const columnCount = useColumnCount()
  const columns = useMasonryColumns(loadedFolders, columnCount)

  return (
    <div className="flex flex-col gap-4">
      {loadedFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-muted-foreground">No waypoints yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="flex gap-4 w-full min-w-0">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0">
              {column.map((folder: any) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  waypoints={folder.waypoints ?? []}
                  folderLogs={folder.logs ?? []}
                  totalWaypointCount={filteredCountMap ? (filteredCountMap[folder.id] ?? 0) : (folder._count?.waypoints ?? 0)}
                  tags={tags}
                  onAddWaypoint={handleAddWaypoint}
                  onEditWaypoint={handleEditWaypoint}
                  onAddLog={handleAddLog}
                  onEditLog={handleEditLog}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <WaypointDrawer
        open={waypointDrawerOpen}
        onClose={() => setWaypointDrawerOpen(false)}
        waypoint={editingWaypoint}
        folders={folders}
        tags={tags}
        defaultFolderId={defaultFolderId}
      />

      <LogDrawer
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        log={editingLog}
        folders={folders}
        waypoints={[]}
        tags={tags}
        defaultFolderId={defaultLogFolderId}
        defaultWaypointId={defaultWaypointId}
      />
    </div>
  )
}