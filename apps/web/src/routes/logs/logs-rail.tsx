import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

export interface LogbookSummary {
  id: string
  trailId: string | null
  name: string
  pageCount: number
  updatedAt: string
  logs: { id: string; title: string | null; content: string }[]
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function LogsRail({
  logbooks,
  selectedBookId,
  search,
  onSearchChange,
  onSelectBook,
  onNew,
}: {
  logbooks: LogbookSummary[]
  selectedBookId: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelectBook: (bookId: string, pageId?: string) => void
  onNew: () => void
}) {
  const { terms } = useTerminology()
  const singular = terms.logs.slice(0, -1) || terms.logs
  const query = search.trim().toLowerCase()
  const filtered = query
    ? logbooks.filter(
        (book) =>
          book.name.toLowerCase().includes(query) ||
          book.logs.some(
            (log) =>
              log.title?.toLowerCase().includes(query) ||
              log.content.replace(/<[^>]*>/g, '').toLowerCase().includes(query),
          ),
      )
    : logbooks

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">{terms.logbook}s</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onNew}
              aria-label={`Add ${singular.toLowerCase()}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add {singular.toLowerCase()}</TooltipContent>
        </Tooltip>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Filter ${terms.logbook.toLowerCase()}s…`}
          className="h-8"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {query
                ? `No ${terms.logbook.toLowerCase()}s match your filter.`
                : `No ${terms.logbook.toLowerCase()}s yet.`}
            </p>
            {!query ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Use + to create a {singular.toLowerCase()} on a {terms.trails.slice(0, -1).toLowerCase()}.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {filtered.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => onSelectBook(book.id, book.logs[0]?.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-muted-hover',
                  selectedBookId === book.id && 'bg-primary/10 hover:bg-primary/10',
                )}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{book.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {book.pageCount}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated {formatUpdatedAt(book.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
