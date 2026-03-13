'use client'

import { NotebookPen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { useTerminology } from '@/contexts/terminology-context'

interface LogItem {
  id: string
  content: string
  createdAt: Date | string
  folderId: string | null
  waypointId: string | null
  folder: { id: string; name: string } | null
  waypoint: { id: string; title: string } | null
  tags: { tagId: string; tag: { id: string; name: string; color: string; icon: string | null } }[]
}

interface LogListProps {
  logs: LogItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

interface FolderGroup {
  folderId: string | null
  folderName: string
  logs: LogItem[]
}

function groupByFolder(logs: LogItem[]): FolderGroup[] {
  const map = new Map<string | null, FolderGroup>()

  for (const log of logs) {
    const key = log.folderId
    if (!map.has(key)) {
      map.set(key, {
        folderId: key,
        folderName: log.folder?.name ?? 'Unfiled',
        logs: [],
      })
    }
    map.get(key)!.logs.push(log)
  }

  // Named folders first (sorted), Unfiled at the end
  const named = [...map.entries()]
    .filter(([k]) => k !== null)
    .sort((a, b) => a[1].folderName.localeCompare(b[1].folderName))
    .map(([, v]) => v)

  const unfiled = map.get(null)

  return unfiled ? [...named, unfiled] : named
}

export function LogList({ logs, selectedId, onSelect, onNew }: LogListProps) {
  const { terms } = useTerminology()
  const groups = groupByFolder(logs)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {logs.length} {logs.length !== 1 ? terms.logs.toLowerCase() : terms.logs.slice(0, -1).toLowerCase()}
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
            <div key={group.folderId ?? '__unfiled__'}>
              {/* Folder header */}
              <div className="sticky top-0 z-10 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border-b">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.folderName}
                  <span className="ml-1.5 font-normal normal-case">({group.logs.length})</span>
                </span>
              </div>

              {/* Log entries */}
              <div className="flex flex-col divide-y">
                {group.logs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => onSelect(log.id)}
                    className={`w-full flex flex-col items-start gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selectedId === log.id ? 'bg-primary/10 hover:bg-primary/10' : ''
                      }`}
                  >
                    {/* Content preview */}
                    <div className="w-full text-sm text-muted-foreground line-clamp-2 [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0">
                      <RichTextContent html={log.content} />
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 w-full">
                      <span className="text-xs text-muted-foreground/70">
                        {format(new Date(log.createdAt), 'MMM d, yyyy')}
                      </span>
                      {log.waypoint && (
                        <span className="text-xs text-muted-foreground/70 truncate max-w-[120px]">
                          · {log.waypoint.title}
                        </span>
                      )}
                      {log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.tags.map(t => (
                            <MarkerBadge key={t.tagId} marker={t.tag} />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
