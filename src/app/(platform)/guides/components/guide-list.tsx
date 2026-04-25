'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'
import { Pencil, Play, Plus, Route, Trash2 } from 'lucide-react'

type GuideWithStones = {
  id: string
  name: string
  description: string | null
  trail: { id: string; name: string } | null
  stones: { id: string }[]
}

interface GuideListProps {
  guides: GuideWithStones[]
  selectedGuideId: string | null
  selectedForTraverse: string[]
  onSelect: (id: string) => void
  onToggleTraverse: (id: string) => void
  onNew: () => void
  onEdit: (guide: any) => void
  onLaunch: (id: string) => void
  onLaunchTraverse: () => void
  onDelete: (id: string, name: string) => void
}

export function GuideList({
  guides,
  selectedGuideId,
  selectedForTraverse,
  onSelect,
  onToggleTraverse,
  onNew,
  onEdit,
  onLaunch,
  onLaunchTraverse,
  onDelete,
}: GuideListProps) {
  const { terms } = useTerminology()
  const traverseCount = selectedForTraverse.length
  const canTraverse = traverseCount >= 2

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">
          {guides.length} {guides.length === 1 ? terms.guide.toLowerCase() : terms.guides.toLowerCase()}
        </span>
        <div className="flex items-center gap-1">
          {canTraverse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onLaunchTraverse}
                >
                  <Route className="h-3.5 w-3.5" />
                  {terms.guideTraverse}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Launch {terms.guideTraverse.toLowerCase()} with {traverseCount} {terms.guides.toLowerCase()}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {terms.guide.toLowerCase()}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {guides.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <p>No {terms.guides.toLowerCase()} yet</p>
            <Button variant="outline" size="sm" onClick={onNew}>
              Add your first {terms.guide.toLowerCase()}
            </Button>
          </div>
        ) : (
          guides.map(guide => {
            const isSelected = selectedGuideId === guide.id
            const isChecked = selectedForTraverse.includes(guide.id)
            return (
              <div
                key={guide.id}
                className={`
                  flex items-center justify-between px-4 py-3 border-b border-border/50
                  cursor-pointer transition-colors group
                  ${isSelected ? 'bg-primary/20' : 'hover:bg-muted/50'}
                `}
                onClick={() => onSelect(guide.id)}
              >
                {/* Checkbox */}
                <div
                  className="shrink-0 mr-3"
                  onClick={e => { e.stopPropagation(); onToggleTraverse(guide.id) }}
                >
                  <div className={`
                    h-4 w-4 rounded border-2 flex items-center justify-center transition-colors
                    ${isChecked
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 group-hover:border-muted-foreground/60'}
                  `}>
                    {isChecked && (
                      <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{guide.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {guide.stones.length} {guide.stones.length === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()}
                    </span>
                    {guide.trail && (
                      <span className="text-xs text-muted-foreground truncate">· {guide.trail.name}</span>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                  onClick={e => e.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(guide)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit {terms.guide.toLowerCase()}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary hover:text-primary"
                        onClick={() => onLaunch(guide.id)}
                        disabled={guide.stones.length === 0}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {guide.stones.length === 0
                        ? `Add ${terms.stones.toLowerCase()} first`
                        : `Launch ${terms.guidePass.toLowerCase()}`}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(guide.id, guide.name)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove {terms.guide.toLowerCase()}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
