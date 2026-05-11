import { useSearchParams } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, NotebookPen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { useTerminology } from '@/contexts/terminology-context'

interface LogItem {
  id: string
  title: string | null
  content: string
  createdAt: Date | string
  trailId: string | null
  waypointId: string | null
  trail: { id: string; name: string } | null
  waypoint: { id: string; title: string; url: string } | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

interface LogListProps {
  logs: LogItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onOpenLogbook: (trailId: string, firstLogId: string) => void
  totalCount: number
  currentPage: number
  logsPerPage: number
}

interface TrailGroup {
  trailId: string | null
  trailName: string
  logs: LogItem[]
}

function groupByTrail(logs: LogItem[]): TrailGroup[] {
  const map = new Map<string | null, TrailGroup>()

  for (const log of logs) {
    const key = log.trailId
    if (!map.has(key)) {
      map.set(key, {
        trailId: key,
        trailName: log.trail?.name ?? 'Unfiled',
        logs: [],
      })
    }
    map.get(key)!.logs.push(log)
  }

  const named = [...map.entries()]
    .filter(([k]) => k !== null)
    .sort((a, b) => a[1].trailName.localeCompare(b[1].trailName))
    .map(([, v]) => v)

  const unfiled = map.get(null)

  return unfiled ? [...named, unfiled] : named
}

export function LogList({ logs, selectedId, onSelect, onNew, onOpenLogbook, totalCount, currentPage, logsPerPage }: LogListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { terms } = useTerminology()
  const groups = groupByTrail(logs)
  const totalPages = Math.max(1, Math.ceil(totalCount / logsPerPage))

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    setSearchParams(params)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {totalCount} {totalCount !== 1 ? terms.logs.toLowerCase() : terms.logs.slice(0, -1).toLowerCase()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add {terms.logs.slice(0, -1).toLowerCase()}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <NotebookPen className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No {terms.logs.toLowerCase()} found.</p>
            <button onClick={onNew} className="text-sm text-primary hover:underline mt-1">
              Write your first {terms.logs.slice(0, -1).toLowerCase()}
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.trailId ?? '__unfiled__'}>
              <div className="sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.trailName}
                  <span className="ml-1.5 font-normal normal-case">({group.logs.length})</span>
                </span>
                {group.trailId !== null && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onOpenLogbook(group.trailId!, group.logs[0].id)}
                      >
                        <BookOpen className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open {terms.logbook.toLowerCase()}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex flex-col divide-y">
                {group.logs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-stretch transition-colors hover:bg-muted/50 ${selectedId === log.id ? 'bg-primary/10 hover:bg-primary/10' : ''}`}
                  >
                    <button
                      className="flex flex-col items-start gap-1.5 px-4 py-3 text-left flex-1 min-w-0"
                      onClick={() => onSelect(log.id)}
                    >
                      {log.title && (
                        <span className="w-full text-sm font-medium truncate">
                          {log.title}
                        </span>
                      )}

                      <div className="w-full text-sm text-muted-foreground line-clamp-2 [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0">
                        <RichTextContent html={log.content} />
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 w-full">
                        <span className="text-xs text-muted-foreground/70">
                          {format(new Date(log.createdAt), 'MMM d, yyyy')}
                        </span>
                        {log.markers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {log.markers.map(t => (
                              <MarkerBadge key={t.markerId} marker={t.marker} />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    {log.waypoint && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={log.waypoint.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center px-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>{log.waypoint.title}</TooltipContent>
                      </Tooltip>
                    )}
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
