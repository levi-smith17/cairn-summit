import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bookmark, BookCheck, ChevronLeft, ChevronRight, Clock, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from './marker-badge'
import { toggleWaypointRead, toggleWaypointReadLater } from '@/lib/api/waypoints'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'

interface WaypointItem {
  id: string
  title: string
  url: string
  favicon: string | null
  read: boolean
  readLater: boolean
  trailId: string | null
  trail: { id: string; name: string } | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

interface WaypointListProps {
  waypoints: WaypointItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  totalCount: number
  currentPage: number
  waypointsPerPage: number
}

interface TrailGroup {
  trailId: string | null
  trailName: string
  waypoints: WaypointItem[]
}

function groupByTrail(waypoints: WaypointItem[], noTrailLabel: string): TrailGroup[] {
  const map = new Map<string | null, TrailGroup>()

  for (const waypoint of waypoints) {
    const key = waypoint.trailId
    if (!map.has(key)) {
      map.set(key, {
        trailId: key,
        trailName: waypoint.trail?.name ?? noTrailLabel,
        waypoints: [],
      })
    }
    map.get(key)!.waypoints.push(waypoint)
  }

  // Named trails first (sorted alphabetically), No Trail at the end
  const named = [...map.entries()]
    .filter(([k]) => k !== null)
    .sort((a, b) => a[1].trailName.localeCompare(b[1].trailName))
    .map(([, v]) => v)

  const noTrail = map.get(null)
  return noTrail ? [...named, noTrail] : named
}

export function WaypointList({ waypoints, selectedId, onSelect, onNew, totalCount, currentPage, waypointsPerPage }: WaypointListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const noTrailLabel = `No ${terms.trails.slice(0, -1)}`
  const groups = groupByTrail(waypoints, noTrailLabel)
  const totalPages = Math.max(1, Math.ceil(totalCount / waypointsPerPage))

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    setSearchParams(params)
  }

  async function handleToggleReadLater(e: React.MouseEvent, waypoint: WaypointItem) {
    e.stopPropagation()
    await toggleWaypointReadLater(waypoint.id, !waypoint.readLater)
    queryClient.invalidateQueries({ queryKey: ['waypoints'] })
  }

  async function handleToggleRead(e: React.MouseEvent, waypoint: WaypointItem) {
    e.stopPropagation()
    await toggleWaypointRead(waypoint.id, !waypoint.read)
    queryClient.invalidateQueries({ queryKey: ['waypoints'] })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Count header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {totalCount} {totalCount !== 1 ? terms.waypoints.toLowerCase() : terms.waypoints.slice(0, -1).toLowerCase()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add {terms.waypoints.slice(0, -1).toLowerCase()}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {waypoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No {terms.waypoints.toLowerCase()} found.</p>
            <button onClick={onNew} className="text-sm text-primary hover:underline mt-1">
              Add your first {terms.waypoints.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.trailId ?? '__notrail__'}>
              {/* Trail header */}
              <div className="sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.trailName}
                  <span className="ml-1.5 font-normal normal-case">({group.waypoints.length})</span>
                </span>
              </div>

              {/* Waypoints */}
              <div className="flex flex-col divide-y">
                {group.waypoints.map(waypoint => (
                  <div
                    key={waypoint.id}
                    onClick={() => onSelect(waypoint.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === waypoint.id ? 'bg-primary/10 hover:bg-primary/10' : ''
                      } ${waypoint.read ? 'opacity-60' : ''}`}
                  >
                    {/* Favicon */}
                    {waypoint.favicon && (
                      <div className="shrink-0 mt-0.5">
                        <img
                          src={waypoint.favicon}
                          alt=""
                          className="h-4 w-4 rounded"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-snug">{waypoint.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{waypoint.url}</p>
                      {waypoint.markers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {waypoint.markers.slice(0, 3).map(t => (
                            <MarkerBadge key={t.markerId} marker={t.marker} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={waypoint.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          Open {terms.waypoints.slice(0, -1).toLowerCase()}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={e => handleToggleReadLater(e, waypoint)}
                          >
                            <Clock className={`h-3.5 w-3.5 ${waypoint.readLater ? 'fill-current' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Read later
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={e => handleToggleRead(e, waypoint)}
                          >
                            <BookCheck className={`h-3.5 w-3.5 ${waypoint.read ? 'text-primary' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Mark {terms.waypoints.slice(0, -1).toLowerCase()} read
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
