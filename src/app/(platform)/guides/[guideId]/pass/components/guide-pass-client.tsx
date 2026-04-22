'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTerminology } from '@/contexts/terminology-context'
import { updateStonePlacement, resetGuidePlacements } from '@/actions/guides'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Shuffle,
  RotateCcw,
  Check,
  Tag,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type StonePlacement = 'UNPLACED' | 'PLACED' | 'SET' | 'SEATED'

const PLACEMENT_ORDER: StonePlacement[] = ['UNPLACED', 'PLACED', 'SET', 'SEATED']

type StoneWithMarkers = {
  id: string
  face: string
  core: string
  placement: StonePlacement
  markers: { markerId: string; marker: { id: string; name: string; color: string } }[]
}

type Guide = {
  id: string
  name: string
  stones: StoneWithMarkers[]
}

const PLACEMENT_STYLES: Record<StonePlacement, { badge: string; button: string; active: string }> = {
  UNPLACED: {
    badge: 'bg-muted text-muted-foreground',
    button: 'border-muted-foreground/30 text-muted-foreground hover:bg-muted',
    active: 'bg-muted text-foreground border-muted-foreground',
  },
  PLACED: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    button: 'border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20',
    active: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300',
  },
  SET: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    button: 'border-blue-400 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20',
    active: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/40 dark:text-blue-300',
  },
  SEATED: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    button: 'border-green-400 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/20',
    active: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-300',
  },
}

interface GuidePassClientProps {
  guide: Guide
  allMarkers: { id: string; name: string; color: string }[]
}

export function GuidePassClient({ guide, allMarkers }: GuidePassClientProps) {
  const router = useRouter()
  const { terms } = useTerminology()
  const [, startTransition] = useTransition()

  // Stone state (mutable — updated when placements change)
  const [stones, setStones] = useState<StoneWithMarkers[]>(guide.stones)
  // Display order (separate so scatter doesn't lose placement updates)
  const [stoneOrder, setStoneOrder] = useState<StoneWithMarkers[]>(guide.stones)
  const [isScattered, setIsScattered] = useState(false)

  // Navigation
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  // Filters
  const [placementFilter, setPlacementFilter] = useState<StonePlacement | 'ALL'>('ALL')
  const [markerFilter, setMarkerFilter] = useState<string[]>([])

  // Dialogs
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Keep stoneOrder in sync when stones placement changes
  useEffect(() => {
    setStoneOrder(prev => prev.map(s => stones.find(st => st.id === s.id) ?? s))
  }, [stones])

  // Reset navigation when filters change
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowProgress(false)
  }, [placementFilter, markerFilter])

  // Reset flip when card changes
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const filteredStones = useMemo(() => {
    let result = stoneOrder
    if (placementFilter !== 'ALL') {
      const maxIdx = PLACEMENT_ORDER.indexOf(placementFilter)
      result = result.filter(s => PLACEMENT_ORDER.indexOf(s.placement) <= maxIdx)
    }
    if (markerFilter.length > 0) {
      result = result.filter(s => s.markers.some(m => markerFilter.includes(m.markerId)))
    }
    return result
  }, [stoneOrder, placementFilter, markerFilter])

  const currentStone = filteredStones[currentIndex] ?? null

  // Placement counts for progress summary
  const placementCounts = useMemo(() => {
    const counts: Record<StonePlacement, number> = { UNPLACED: 0, PLACED: 0, SET: 0, SEATED: 0 }
    filteredStones.forEach(s => counts[s.placement]++)
    return counts
  }, [filteredStones])

  function getPlacementLabel(p: StonePlacement): string {
    switch (p) {
      case 'UNPLACED': return terms.unplaced
      case 'PLACED': return terms.placed
      case 'SET': return terms.setStone
      case 'SEATED': return terms.seated
    }
  }

  function handleScatter() {
    const shuffled = [...stones].sort(() => Math.random() - 0.5)
    setStoneOrder(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowProgress(false)
    setIsScattered(true)
  }

  function handleUnscatter() {
    setStoneOrder([...stones])
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowProgress(false)
    setIsScattered(false)
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  function handleNext() {
    if (currentIndex < filteredStones.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setShowProgress(true)
    }
  }

  function handleRestart(scatter = false) {
    if (scatter) {
      const shuffled = [...stones].sort(() => Math.random() - 0.5)
      setStoneOrder(shuffled)
      setIsScattered(true)
    } else {
      // Keep current order
    }
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowProgress(false)
  }

  function handleSetPlacement(placement: StonePlacement) {
    if (!currentStone) return
    const stoneId = currentStone.id
    setStones(prev => prev.map(s => s.id === stoneId ? { ...s, placement } : s))
    startTransition(() => { updateStonePlacement(stoneId, placement) })
  }

  async function handleReset() {
    setResetting(true)
    try {
      await resetGuidePlacements(guide.id)
      const reset = stones.map(s => ({ ...s, placement: 'UNPLACED' as StonePlacement }))
      setStones(reset)
      setStoneOrder(isScattered ? [...reset].sort(() => Math.random() - 0.5) : reset)
      setCurrentIndex(0)
      setIsFlipped(false)
      setShowProgress(false)
    } finally {
      setResetting(false)
      setResetDialogOpen(false)
    }
  }

  function toggleMarkerFilter(markerId: string) {
    setMarkerFilter(prev =>
      prev.includes(markerId) ? prev.filter(id => id !== markerId) : [...prev, markerId]
    )
  }

  // Only show markers that appear on at least one stone in this guide
  const relevantMarkers = allMarkers.filter(m =>
    stones.some(s => s.markers.some(sm => sm.markerId === m.id))
  )

  const isLastCard = currentIndex === filteredStones.length - 1
  const hasStones = filteredStones.length > 0

  return (
    <>
      <PlatformHeader title={terms.guidePass} />

      <div className="flex flex-col flex-1 overflow-y-auto p-4 items-center justify-center">
        {/* Outer card wrapping all pass UI */}
        <div className="flex flex-col w-full max-w-2xl rounded-lg border border-border bg-card overflow-hidden">

          {/* Card header: back + guide name + scatter/reset */}
          <div className="flex flex-col md:flex-row items-center gap-2 px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-7 shrink-0"
                    onClick={() => router.push(`/guides?guide=${guide.id}`)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to {terms.guide.toLowerCase()}</TooltipContent>
              </Tooltip>
              <h2 className="text-sm font-semibold truncate flex-1 min-w-0">{guide.name}</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-1.5 shrink-0 w-full md:w-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isScattered ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs grow md:grow-0"
                    onClick={isScattered ? handleUnscatter : handleScatter}
                  >
                    <Shuffle className="h-3 w-3" />
                    {isScattered ? 'Ordered' : terms.scatter}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isScattered ? 'Return to original order' : `${terms.scatter} ${terms.stones.toLowerCase()}`}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 grow md:grow-0"
                    onClick={() => setResetDialogOpen(true)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset all placements</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-4 md:gap-2 flex-wrap px-4 py-4 md:py-2 border-b shrink-0">
            {/* Placement filter */}
            <div className="flex items-center gap-1 flex-wrap w-full md:w-auto">
              {(['ALL', 'UNPLACED', 'PLACED', 'SET', 'SEATED'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setPlacementFilter(level)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors grow md:grow-0 ${placementFilter === level
                    ? level === 'ALL'
                      ? 'bg-foreground text-background border-foreground'
                      : PLACEMENT_STYLES[level as StonePlacement].active
                    : level === 'ALL'
                      ? 'border-border text-muted-foreground hover:bg-muted'
                      : PLACEMENT_STYLES[level as StonePlacement].button
                    }`}
                >
                  {level === 'ALL' ? 'All' : getPlacementLabel(level as StonePlacement)}
                </button>
              ))}
            </div>

            {/* Marker filter — multi-select dropdown */}
            {relevantMarkers.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={markerFilter.length > 0 ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs shrink-0 w-full md:w-auto md:ml-auto"
                  >
                    <Tag className="h-3 w-3" />
                    {markerFilter.length === 0
                      ? `All ${terms.markers}`
                      : `${markerFilter.length} ${markerFilter.length === 1 ? terms.markers.replace(/s$/, '') : terms.markers}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1.5" align="start">
                  <div className="flex flex-col gap-0.5">
                    {relevantMarkers.map(marker => {
                      const selected = markerFilter.includes(marker.id)
                      return (
                        <button
                          key={marker.id}
                          onClick={() => toggleMarkerFilter(marker.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left w-full ${selected ? 'bg-muted' : 'hover:bg-muted/60'
                            }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: marker.color }}
                          />
                          <span className="flex-1 truncate">{marker.name}</span>
                          {selected && <Check className="h-3 w-3 shrink-0 text-foreground" />}
                        </button>
                      )
                    })}
                    {markerFilter.length > 0 && (
                      <>
                        <div className="-mx-1.5 my-1 border-t" />
                        <button
                          onClick={() => setMarkerFilter([])}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left w-full text-muted-foreground hover:bg-muted/60"
                        >
                          Clear selection
                        </button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Main content */}
          <div className="overflow-hidden">
            <div className="flex flex-col items-center gap-4 p-4">

              {!hasStones ? (
                /* Empty state */
                <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                  <p>No {terms.stones.toLowerCase()} match your filters</p>
                  <Button variant="outline" size="sm" onClick={() => { setPlacementFilter('ALL'); setMarkerFilter([]) }}>
                    Clear filters
                  </Button>
                </div>
              ) : showProgress ? (
                /* Progress summary */
                <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center">
                  <CheckCircle2 className="h-14 w-14 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-lg">{terms.guidePass} Complete!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredStones.length} {filteredStones.length === 1 ? terms.stone.toLowerCase() : terms.stones.toLowerCase()} reviewed
                    </p>
                  </div>

                  {/* Placement breakdown */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {(PLACEMENT_ORDER as StonePlacement[]).map(p => (
                      <div key={p} className={`rounded-lg p-3 ${PLACEMENT_STYLES[p].badge}`}>
                        <p className="text-2xl font-bold tabular-nums">{placementCounts[p]}</p>
                        <p className="text-xs font-medium mt-0.5">{getPlacementLabel(p)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 w-full">
                    <Button onClick={() => router.push(`/guides?guide=${guide.id}`)} variant="outline" className="w-full gap-2">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to {terms.guide.toLowerCase()}
                    </Button>
                    <Button onClick={() => handleRestart(false)} className="w-full">
                      Restart
                    </Button>
                    <Button onClick={() => handleRestart(true)} variant="outline" className="w-full gap-2">
                      <Shuffle className="h-3.5 w-3.5" />
                      {terms.scatter} &amp; Restart
                    </Button>
                  </div>
                </div>
              ) : currentStone ? (
                /* Flip card */
                <div className="w-full max-w-lg">
                  <FlipCard
                    stone={currentStone}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(f => !f)}
                    onSetPlacement={handleSetPlacement}
                    terms={{
                      stoneFace: terms.stoneFace,
                      stoneCore: terms.stoneCore,
                      placed: terms.placed,
                      setStone: terms.setStone,
                      seated: terms.seated,
                    }}
                  />
                </div>
              ) : null}

            </div>
          </div>

          {/* Navigation footer — only when showing a card */}
          {hasStones && !showProgress && currentStone && (
            <div className="flex items-center justify-between px-4 py-3 border-t shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="h-8 gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {currentIndex + 1} / {filteredStones.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-8 gap-1.5"
              >
                {isLastCard ? 'Finish' : 'Next'}
                {!isLastCard && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Reset confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all placements</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all {terms.stones.toLowerCase()} in &ldquo;{guide.name}&rdquo; back to{' '}
              <strong>{terms.unplaced}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? 'Resetting…' : 'Reset placements'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Flip Card ─────────────────────────────────────────────────────────────────

interface FlipCardProps {
  stone: StoneWithMarkers
  isFlipped: boolean
  onFlip: () => void
  onSetPlacement: (p: StonePlacement) => void
  terms: {
    stoneFace: string
    stoneCore: string
    placed: string
    setStone: string
    seated: string
  }
}

function FlipCard({ stone, isFlipped, onFlip, onSetPlacement, terms }: FlipCardProps) {
  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
      role="button"
      aria-label={isFlipped ? 'Tap to see prompt' : 'Tap to reveal response'}
    >
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Invisible height sizer — sizes the container to the back face (taller) content */}
        <div aria-hidden className="invisible flex flex-col items-center justify-center gap-4 p-8 min-h-[220px]">
          <p className="text-[10px]">&nbsp;</p>
          <p className="text-base text-center leading-relaxed">{stone.core}</p>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            <span className="text-xs px-3 py-1.5">&#8203;</span>
            <span className="text-xs px-3 py-1.5">&#8203;</span>
            <span className="text-xs px-3 py-1.5">&#8203;</span>
          </div>
        </div>

        {/* Front face — Stone Face */}
        <div
          className="absolute inset-0 rounded-xl bg-muted/80 border border-border bg-card shadow-sm flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {terms.stoneFace}
          </p>
          <p className="text-base text-center leading-relaxed">{stone.face}</p>
          <p className="text-xs text-muted-foreground mt-2">Tap to reveal {terms.stoneCore.toLowerCase()}</p>
        </div>

        {/* Back face — Stone Core */}
        <div
          className="absolute inset-0 rounded-xl bg-muted/80 border border-border bg-card shadow-sm flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' } as React.CSSProperties}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {terms.stoneCore}
          </p>
          <p className="text-base text-center leading-relaxed">{stone.core}</p>

          {/* Placement buttons */}
          <div
            className="flex gap-2 flex-wrap justify-center mt-2"
            onClick={e => e.stopPropagation()}
          >
            {(['PLACED', 'SET', 'SEATED'] as const).map(p => {
              const label = p === 'PLACED' ? terms.placed : p === 'SET' ? terms.setStone : terms.seated
              const isActive = stone.placement === p
              return (
                <button
                  key={p}
                  onClick={(e) => { e.stopPropagation(); onSetPlacement(p) }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${isActive ? PLACEMENT_STYLES[p].active : PLACEMENT_STYLES[p].button
                    }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
