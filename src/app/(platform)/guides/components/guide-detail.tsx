'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTerminology } from '@/contexts/terminology-context'
import { ChevronLeft, Pencil, Play, Plus, Trash2, Upload } from 'lucide-react'
import { ImportDialog } from './import-dialog'

type StonePlacement = 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'

type StoneWithMarkers = {
  id: string
  face: string
  core: string
  placement: StonePlacement
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
}

type GuideWithStones = {
  id: string
  name: string
  description: string | null
  trail: { id: string; name: string } | null
  stones: StoneWithMarkers[]
}

const PLACEMENT_COLORS: Record<StonePlacement, string> = {
  UNPLACED: 'bg-muted text-muted-foreground',
  PLACED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  SET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  SEATED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

interface GuideDetailProps {
  guide: GuideWithStones
  markers: { id: string; name: string; color: string }[]
  stoneSearch?: string
  stoneMarkerIds?: string[]
  onBack: () => void
  onEditGuide: () => void
  onLaunchPass: () => void
  onAddStone: () => void
  onEditStone: (stone: StoneWithMarkers) => void
  onDeleteStone: (id: string, face: string) => void
  onImported?: () => void
}

export function GuideDetail({
  guide,
  markers,
  stoneSearch = '',
  stoneMarkerIds = [],
  onBack,
  onEditGuide,
  onLaunchPass,
  onAddStone,
  onEditStone,
  onDeleteStone,
  onImported,
}: GuideDetailProps) {
  const { terms } = useTerminology()
  const [importOpen, setImportOpen] = useState(false)

  const filteredStones = useMemo(() => {
    let result = guide.stones
    if (stoneSearch) {
      const q = stoneSearch.toLowerCase()
      result = result.filter(s =>
        s.face.toLowerCase().includes(q) || s.core.toLowerCase().includes(q)
      )
    }
    if (stoneMarkerIds.length > 0) {
      result = result.filter(s => s.markers.some(m => stoneMarkerIds.includes(m.markerId)))
    }
    return result
  }, [guide.stones, stoneSearch, stoneMarkerIds])

  const isFiltered = stoneSearch !== '' || stoneMarkerIds.length > 0

  function getPlacementLabel(placement: StonePlacement): string {
    switch (placement) {
      case 'UNPLACED': return terms.unplaced
      case 'PLACED': return terms.placed
      case 'SET': return terms.setStone
      case 'SEATED': return terms.seated
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-medium truncate">{guide.name}</h2>
            {guide.trail && (
              <p className="text-xs text-muted-foreground truncate">{guide.trail.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditGuide}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit {terms.guide.toLowerCase()}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" onClick={onLaunchPass} disabled={guide.stones.length === 0}>
                <Play className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Launch {terms.guidePass.toLowerCase()}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Description */}
      {guide.description && (
        <div className="px-4 py-2 border-b">
          <p className="text-xs text-muted-foreground">{guide.description}</p>
        </div>
      )}

      {/* Stone list header */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0 bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {isFiltered
            ? `${filteredStones.length} of ${guide.stones.length} ${guide.stones.length === 1 ? terms.stone : terms.stones}`
            : `${guide.stones.length} ${guide.stones.length === 1 ? terms.stone : terms.stones}`}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import {terms.stones.toLowerCase()}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddStone}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add {terms.stone.toLowerCase()}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stone list */}
      <div className="flex-1 overflow-y-auto">
        {guide.stones.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <p>No {terms.stones.toLowerCase()} yet</p>
            <Button variant="outline" size="sm" onClick={onAddStone}>
              Add your first {terms.stone.toLowerCase()}
            </Button>
          </div>
        ) : filteredStones.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <p>No {terms.stones.toLowerCase()} match your filters</p>
          </div>
        ) : (
          filteredStones.map(stone => (
            <div
              key={stone.id}
              className="flex items-start justify-between px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer"
              onClick={() => onEditStone(stone)}
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{stone.face}</p>
                <p className="text-xs text-muted-foreground truncate opacity-70">{stone.core}</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PLACEMENT_COLORS[stone.placement]}`}>
                    {getPlacementLabel(stone.placement)}
                  </span>
                  {stone.markers.map(({ marker }) => (
                    <span
                      key={marker.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: marker.color }}
                    >
                      {marker.name}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ml-2 mt-0.5"
                onClick={e => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditStone(stone)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteStone(stone.id, stone.face)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        guideId={guide.id}
        guideName={guide.name}
        markers={markers as { id: string; name: string; color: string; icon: string | null }[]}
        onImported={() => {
          setImportOpen(false)
          onImported?.()
        }}
      />
    </div>
  )
}
