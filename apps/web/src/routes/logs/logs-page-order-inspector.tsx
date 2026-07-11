import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical } from 'lucide-react'
import { InspectorChrome, InspectorChromeTitle } from '@/components/studio/ui/inspector-chrome'
import { reorderLogs } from '@/lib/api/logs'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

interface PageLog {
  id: string
  title: string | null
  content: string
  createdAt: Date | string
}

function pagePreview(log: PageLog) {
  return (
    log.title ||
    log.content.replace(/<[^>]*>/g, '').trim().slice(0, 80) ||
    'Empty page'
  )
}

function SortablePageRow({
  log,
  index,
  isActive,
  onSelect,
}: {
  log: PageLog
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: log.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-2 border-b border-border px-4 py-3 text-sm transition-colors',
        isDragging && 'opacity-50',
        isActive && 'bg-primary/10',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className={cn('truncate', log.title ? 'font-medium' : 'text-muted-foreground')}>
          {pagePreview(log)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(log.createdAt).toLocaleDateString()}
        </p>
      </button>
      {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
    </div>
  )
}

export function LogsPageOrderInspector({
  logs,
  activePageId,
  bookName,
  onLogsChange,
  onSelectPage,
}: {
  logs: PageLog[]
  activePageId: string | null
  bookName: string
  onLogsChange: (logs: PageLog[]) => void
  onSelectPage: (pageId: string) => void
}) {
  const { terms } = useTerminology()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = useMemo(() => logs.map((log) => log.id), [logs])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = logs.findIndex((log) => log.id === active.id)
    const newIndex = logs.findIndex((log) => log.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(logs, oldIndex, newIndex)
    onLogsChange(next)
    await reorderLogs(next.map((log) => log.id))
  }

  return (
    <div className="flex h-full flex-col">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow={`Reorder ${terms.logs.toLowerCase()}`}
          title={bookName}
        />
      </InspectorChrome>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {logs.map((log, index) => (
              <SortablePageRow
                key={log.id}
                log={log}
                index={index}
                isActive={activePageId === log.id}
                onSelect={() => onSelectPage(log.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
