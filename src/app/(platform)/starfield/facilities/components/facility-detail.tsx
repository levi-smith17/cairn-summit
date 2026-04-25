'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function planetDisplay(planet: any) {
  return `${planet.name} (${planet.system.name})`
}

// Depth-based styling
const depthStyles = {
  1: {
    border: 'border-l-4 border-l-blue-500/60',
    bg: 'bg-muted/40',
    headerBg: 'bg-muted/60',
    dot: 'bg-blue-500/60',
  },
  2: {
    border: 'border-l-4 border-l-violet-500',
    bg: 'bg-muted/60',
    headerBg: 'bg-muted/80',
    dot: 'bg-violet-500',
  },
  3: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-muted/80',
    headerBg: 'bg-muted/90',
    dot: 'bg-amber-500',
  },
}

function ResourceRow({ fr, depth, onEditResource, onDeleteResource }: {
  fr: any
  depth: number
  onEditResource: (fr: any) => void
  onDeleteResource: (id: string, name: string) => void
}) {
  const style = depthStyles[Math.min(depth, 3) as 1 | 2 | 3] ?? depthStyles[3]
  const indent = depth * 16

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-border/50 hover:brightness-105 group text-sm ${style.bg}`}
      style={{ paddingLeft: `${indent}px`, paddingRight: '16px' }}
    >
      <span className="text-foreground/80">
        {fr.resource.name}
        <span className="text-muted-foreground/70 text-xs ml-1">({fr.resource.abbreviation})</span>
        <span className="text-muted-foreground"> — </span>
        {planetDisplay(fr.planet)}
        {fr.onsite && (
          <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 font-normal">
            onsite
          </Badge>
        )}
        {fr.relay && (
          <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground">
            relay: {planetDisplay(fr.relay)}
          </Badge>
        )}
      </span>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditResource(fr)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteResource(fr.id, fr.resource.name)}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function SubfacilitySection({
  id,
  label,
  items,
  depth,
  subfacilityKey,
  facilityAbbreviation,
  facilityId,
  onAddResource,
  onEditResource,
  onDeleteResource,
}: {
  id: string
  label: string
  items: any[]
  depth: 1 | 2 | 3
  subfacilityKey: 'subfacility1' | 'subfacility2' | 'subfacility3'
  facilityAbbreviation: string
  facilityId: string
  onAddResource: (facilityId: string) => void
  onEditResource: (fr: any) => void
  onDeleteResource: (id: string, name: string) => void
}) {
  const style = depthStyles[depth]
  const nextKey = depth === 1 ? 'subfacility2' : depth === 2 ? 'subfacility3' : null

  const borderColorClass = depth === 1
    ? 'border-l-blue-500/60'
    : depth === 2
      ? 'border-l-violet-500'
      : 'border-l-amber-500'

  const indent = depth * 16

  return (
    <div className={`border-l-4 ${borderColorClass}`}>
      {/* Subfacility header */}
      <div
        className={`flex items-center justify-between py-2 border-b border-border ${style.headerBg}`}
        style={{ paddingLeft: `${indent}px`, paddingRight: '16px' }}
      >
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="text-xs font-medium text-muted-foreground">
            [{facilityAbbreviation}-{depth}] {label}
          </span>
          <span className="text-xs text-muted-foreground/50">
            {items.length} resource{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => onAddResource(facilityId)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Contents */}
      {nextKey ? (
        <SubfacilityGroup
          resources={items}
          depth={(depth + 1) as 2 | 3}
          subfacilityKey={nextKey as 'subfacility2' | 'subfacility3'}
          facilityAbbreviation={facilityAbbreviation}
          facilityId={facilityId}
          onAddResource={onAddResource}
          onEditResource={onEditResource}
          onDeleteResource={onDeleteResource}
        />
      ) : (
        items.map(fr => (
          <ResourceRow
            key={fr.id}
            fr={fr}
            depth={depth + 1}
            onEditResource={onEditResource}
            onDeleteResource={onDeleteResource}
          />
        ))
      )}
    </div>
  )
}

function SubfacilityGroup({
  resources,
  depth,
  subfacilityKey,
  facilityAbbreviation,
  facilityId,
  onAddResource,
  onEditResource,
  onDeleteResource,
}: {
  resources: any[]
  depth: 1 | 2 | 3
  subfacilityKey: 'subfacility1' | 'subfacility2' | 'subfacility3'
  facilityAbbreviation: string
  facilityId: string
  onAddResource: (facilityId: string) => void
  onEditResource: (fr: any) => void
  onDeleteResource: (id: string, name: string) => void
}) {
  const withSub = resources.filter(fr => fr[subfacilityKey] != null)
  const withoutSub = resources.filter(fr => fr[subfacilityKey] == null)

  const grouped = new Map<string, { label: string; items: any[] }>()
  for (const fr of withSub) {
    const key = fr[`${subfacilityKey}Id`]
    if (!grouped.has(key)) {
      grouped.set(key, { label: planetDisplay(fr[subfacilityKey]), items: [] })
    }
    grouped.get(key)!.items.push(fr)
  }

  return (
    <>
      {withoutSub.map(fr => (
        <ResourceRow
          key={fr.id}
          fr={fr}
          depth={depth}
          onEditResource={onEditResource}
          onDeleteResource={onDeleteResource}
        />
      ))}
      {Array.from(grouped.entries()).map(([id, group]) => (
        <SubfacilitySection
          key={id}
          id={id}
          label={group.label}
          items={group.items}
          depth={depth}
          subfacilityKey={subfacilityKey}
          facilityAbbreviation={facilityAbbreviation}
          facilityId={facilityId}
          onAddResource={onAddResource}
          onEditResource={onEditResource}
          onDeleteResource={onDeleteResource}
        />
      ))}
    </>
  )
}

interface FacilityDetailProps {
  facility: any | null
  onBack: () => void
  onAddResource: (facilityId: string) => void
  onEditResource: (resource: any) => void
  onDeleteResource: (id: string, name: string) => void
}

export function FacilityDetail({ facility, onBack, onAddResource, onEditResource, onDeleteResource }: FacilityDetailProps) {
  if (!facility) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a facility to view its resources.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-sm font-medium">[{facility.abbreviation}] {facility.name}</span>
            <p className="text-xs text-muted-foreground">{facility.planet.name} ({facility.planet.system.name})</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddResource(facility.id)}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Add resource
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {facility.resources.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No resources yet.
          </div>
        ) : (
          <SubfacilityGroup
            resources={facility.resources}
            depth={1}
            subfacilityKey="subfacility1"
            facilityAbbreviation={facility.abbreviation}
            facilityId={facility.id}
            onAddResource={onAddResource}
            onEditResource={onEditResource}
            onDeleteResource={onDeleteResource}
          />
        )}
      </div>
    </div>
  )
}
