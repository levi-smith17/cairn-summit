import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Pencil, Plus } from 'lucide-react'
import type { SfOutpost, SfOutpostResource } from '@cairn/types'
import type { OutpostValidation, ValidationStatus } from '@/lib/starfield-validation'

export interface OutpostNodeData {
  outpost: SfOutpost & { id: string }
  validation: OutpostValidation | undefined
  onEdit: () => void
  onAddResource: () => void
  onEditResource: (resourceId: string) => void
}

const STATUS_DOT: Record<ValidationStatus, string> = {
  satisfied: 'bg-green-500',
  partial: 'bg-yellow-500',
  missing: 'bg-red-500',
}

const STATUS_BORDER: Record<ValidationStatus, string> = {
  satisfied: 'border-green-500/40',
  partial: 'border-yellow-500/40',
  missing: 'border-red-500/40',
}

function getResourceSourceLabel(
  fr: SfOutpostResource,
  status: ValidationStatus | undefined
): string {
  if (fr.onsite) return '[onsite]'
  if (fr.fromOutpostId) return '[←]'
  if (!status || status === 'missing') return '[!]'
  if (status === 'partial') return '[~]'
  return '[✓]'
}

export const OutpostNode = memo(function OutpostNode({ data }: NodeProps<OutpostNodeData>) {
  const { outpost, validation, onEdit, onAddResource, onEditResource } = data
  const status: ValidationStatus = validation?.status ?? 'missing'
  const transferCount = outpost.resources.filter(fr => fr.fromOutpostId).length

  return (
    <div
      className={`w-52 rounded-lg border-2 bg-card shadow-sm hover:shadow-md transition-shadow ${STATUS_BORDER[status]}`}
    >
      <Handle type="target" position={Position.Bottom} />

      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          <span className="text-sm font-medium truncate flex-1">{outpost.planet}</span>
          <span className="text-xs text-muted-foreground shrink-0">{outpost.system}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {outpost.resources.length} {outpost.resources.length === 1 ? 'resource' : 'resources'}
          </span>
          <div className="flex-1" />
          <button
            className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
            onClick={e => { e.stopPropagation(); onAddResource() }}
            aria-label="Add resource"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
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
        {outpost.resources.map(fr => {
          const rv = validation?.resources.get(fr.resourceId)
          const rvStatus = rv?.status
          return (
            <div key={fr.resourceId} className="group flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${rvStatus ? STATUS_DOT[rvStatus] : 'bg-muted-foreground/40'}`}
              />
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                {fr.abbreviation}
              </span>
              <span className="text-xs truncate flex-1">{fr.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                {getResourceSourceLabel(fr, rvStatus)}
              </span>
              <button
                className="h-4 w-4 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => { e.stopPropagation(); onEditResource(fr.resourceId) }}
                aria-label="Edit resource"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
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

      <Handle type="source" position={Position.Top} />
    </div>
  )
})
