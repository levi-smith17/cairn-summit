import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { SfFacility, SfFacilityResource } from '@cairn/types'
import type { FacilityValidation, ValidationStatus } from '@/lib/starfield-validation'

export interface FacilityNodeData {
  facility: SfFacility & { id: string }
  validation: FacilityValidation | undefined
  onEdit: () => void
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
  fr: SfFacilityResource,
  status: ValidationStatus | undefined
): string {
  if (fr.onsite) return '[onsite]'
  if (fr.fromFacilityId) return '[←]'
  if (!status || status === 'missing') return '[!]'
  if (status === 'partial') return '[~]'
  return '[✓]'
}

export const FacilityNode = memo(function FacilityNode({ data }: NodeProps<FacilityNodeData>) {
  const { facility, validation, onEdit } = data
  const status: ValidationStatus = validation?.status ?? 'missing'
  const transferCount = facility.resources.filter(fr => fr.fromFacilityId).length

  return (
    <div
      className={`w-52 cursor-pointer rounded-lg border-2 bg-card shadow-sm hover:shadow-md transition-shadow ${STATUS_BORDER[status]}`}
      onClick={onEdit}
    >
      <Handle type="target" position={Position.Top} />

      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          <span className="text-sm font-medium truncate flex-1">{facility.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0 bg-muted px-1 rounded">
            {(facility as any).abbreviation ?? '?'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {facility.planet} · {facility.system}
        </p>
      </div>

      {facility.resources.length > 0 && (
        <div className="border-t border-border/50 mx-2 mb-1" />
      )}

      <div className="px-3 pb-2 space-y-1">
        {facility.resources.map(fr => {
          const rv = validation?.resources.get(fr.resourceId)
          const rvStatus = rv?.status
          return (
            <div key={fr.resourceId} className="flex items-center gap-1.5">
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
            </div>
          )
        })}
      </div>

      {facility.transferStationLimit > 0 && (
        <div className="border-t border-border/50 mx-2 mb-2" />
      )}
      {facility.transferStationLimit > 0 && (
        <div className="px-3 pb-2">
          <span className="text-[10px] text-muted-foreground">
            Transfer Stations: {transferCount} / {facility.transferStationLimit}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})
