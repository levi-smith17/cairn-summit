import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Pencil, Plus, House, Factory, Cuboid, Droplet, Wind, Component, MoveLeft, MoveRight, CornerLeftUp, type LucideIcon } from 'lucide-react'
import type { SfOutpost, SfOutpostResource, SfResource } from '@cairn/types'
import type { OutpostValidation, ValidationStatus } from '@/lib/starfield-validation'
import {
  countTransferStations,
  getShippedOutResourceIds,
  getSupplyLines,
  normalizeOutpostResource,
  resolveSourceOutpostId,
  type OutpostWithId,
} from '@/lib/starfield-utils'
import { SF_ICON_CONTROL } from './constants'

export interface OutpostNodeData {
  outpost: SfOutpost & { id: string }
  outposts: (SfOutpost & { id: string })[]
  resources: SfResource[]
  validation: OutpostValidation | undefined
  onEdit: () => void
  onAddResource: () => void
  onEditResource: (resourceId: string) => void
}

const STATUS_ICON_COLOR: Record<ValidationStatus, string> = {
  satisfied: 'text-green-500',
  partial: 'text-yellow-500',
  missing: 'text-red-500',
}

const STATUS_BORDER: Record<ValidationStatus, string> = {
  satisfied: 'border-green-500/40',
  partial: 'border-yellow-500/40',
  missing: 'border-red-500/40',
}

const RESOURCE_TYPE_ICON: Record<string, LucideIcon> = {
  solid: Cuboid,
  liquid: Droplet,
  gas: Wind,
  manufactured: Component,
}

function getSourceLabel(fr: SfOutpostResource, status: ValidationStatus | undefined): string {
  if (fr.onsite) return '[onsite]'
  if (fr.origin) return '[origin]'
  const supplies = getSupplyLines(fr)
  if (supplies.some(s => s.fromOutpostId || s.fromPlanet)) return '[←]'
  if (!status || status === 'missing') return '[!]'
  if (status === 'partial') return '[~]'
  return '[✓]'
}

export const OutpostNode = memo(function OutpostNode({ data }: NodeProps<OutpostNodeData>) {
  const { outpost, outposts, resources, validation, onEdit, onAddResource, onEditResource } = data
  const status: ValidationStatus = validation?.status ?? 'missing'
  const outpostsWithId = outposts as OutpostWithId[]
  const outpostWithId = outpost as OutpostWithId

  const shippedOutResourceIds = useMemo(
    () => getShippedOutResourceIds(outpost.id, outpostsWithId),
    [outpostsWithId, outpost.id]
  )

  const transferCount = useMemo(
    () => countTransferStations(outpostWithId, outpostsWithId),
    [outpostWithId, outpostsWithId]
  )

  const resourceTypeMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of resources) {
      map.set(r.sk.replace(/^RESOURCE#/, ''), r.type ?? '')
    }
    return map
  }, [resources])

  const sortedResources = useMemo(() => {
    return [...outpost.resources].map(normalizeOutpostResource).sort((a, b) => {
      const typeA = resourceTypeMap.get(a.resourceId) ?? ''
      const typeB = resourceTypeMap.get(b.resourceId) ?? ''
      if (typeA !== typeB) return typeA.localeCompare(typeB)
      return a.name.localeCompare(b.name)
    })
  }, [outpost.resources, resourceTypeMap])

  return (
    <div
      className={`w-72 rounded-lg border-2 bg-card shadow-sm hover:shadow-md transition-shadow ${STATUS_BORDER[status]}`}
    >
      <Handle id="left" type="source" position={Position.Left} />

      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {outpost.parentId
            ? <Factory className={`h-3.5 w-3.5 shrink-0 ${STATUS_ICON_COLOR[status]}`} />
            : <House className={`h-3.5 w-3.5 shrink-0 ${STATUS_ICON_COLOR[status]}`} />
          }
          <span className="text-sm font-medium truncate flex-1">{outpost.planet}</span>
          <span className="text-xs text-muted-foreground shrink-0">{outpost.system}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {outpost.resources.length} {outpost.resources.length === 1 ? 'resource' : 'resources'}
          </span>
          <div className="flex-1" />
          <button
            className={`${SF_ICON_CONTROL} inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0`}
            onClick={e => { e.stopPropagation(); onAddResource() }}
            aria-label="Add resource"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            className={`${SF_ICON_CONTROL} inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0`}
            onClick={e => { e.stopPropagation(); onEdit() }}
            aria-label="Edit outpost"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>

      {outpost.resources.length > 0 && (
        <div className="border-t border-border/50 mx-2 mb-1" />
      )}

      <div className="px-3 pb-2 space-y-1">
        {sortedResources.map(fr => {
          const rv = validation?.resources.get(fr.resourceId)
          const rvStatus = rv?.status
          const resourceType = resourceTypeMap.get(fr.resourceId) ?? ''
          const ResourceIcon = RESOURCE_TYPE_ICON[(resourceType ?? '').toLowerCase()] ?? Cuboid
          const supplies = fr.onsite ? [] : getSupplyLines(fr)
          const showExportArrow = shippedOutResourceIds.has(fr.resourceId)

          return (
            <div key={fr.resourceId} className="flex flex-col gap-0.5">
              <div className="group flex items-center gap-1.5">
                <ResourceIcon
                  className={`h-3 w-3 shrink-0 ${rvStatus ? STATUS_ICON_COLOR[rvStatus] : 'text-muted-foreground/40'}`}
                />
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {fr.abbreviation}
                </span>
                <span className="text-xs truncate flex-1">{fr.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {getSourceLabel(fr, rvStatus)}
                </span>
                {showExportArrow && (
                  <MoveRight className="h-2.5 w-2.5 shrink-0 text-orange-400/80" />
                )}
                <button
                  className={`${SF_ICON_CONTROL} inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[colors,opacity] shrink-0 [@media(hover:hover)]:md:opacity-0 [@media(hover:hover)]:md:group-hover:opacity-100`}
                  onClick={e => { e.stopPropagation(); onEditResource(fr.resourceId) }}
                  aria-label="Edit resource"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              {supplies.map((supply, idx) => {
                const sourceId = resolveSourceOutpostId(supply, outpostsWithId)
                const sourceOutpost = sourceId ? outpostsWithId.find(o => o.id === sourceId) : undefined
                const sourcePlanet = sourceOutpost?.planet ?? supply.fromPlanet
                const sourceSystem = sourceOutpost?.system ?? supply.fromSystem
                if (!sourcePlanet && !supply.relay) return null
                return (
                  <div key={idx} className="flex flex-col gap-0.5">
                    {supply.relay && (
                      <div className="pl-3 text-[9px] text-muted-foreground leading-none flex items-center gap-0.5">
                        <MoveLeft className="h-2 w-2 shrink-0 text-sky-400/80" />
                        {supply.relay.planet} ({supply.relay.system})
                      </div>
                    )}
                    {sourcePlanet && (
                      <div className="pl-3 text-[9px] text-muted-foreground leading-none flex items-center gap-0.5">
                        {supply.relay
                          ? <CornerLeftUp className="h-2 w-2 shrink-0" />
                          : <MoveLeft className="h-2 w-2 shrink-0" />
                        }
                        {sourcePlanet} ({sourceSystem ?? '?'})
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {outpost.transferStationLimit > 0 && (
        <div className="border-t border-border/50 mx-2 mb-2" />
      )}
      {outpost.transferStationLimit > 0 && (
        <div className="px-3 pb-2">
          <span className="text-[10px] text-muted-foreground">
            Transfer Stations: {transferCount} / {outpost.transferStationLimit}
          </span>
        </div>
      )}

      <Handle id="right" type="target" position={Position.Right} />
    </div>
  )
})
