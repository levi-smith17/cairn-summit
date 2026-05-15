import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Heart } from 'lucide-react'
import type { Kin } from '@cairn/types'

export interface KinNodeData {
  kin: Kin & { id: string }
  isValid: boolean
  onEdit: () => void
}

function formatYear(dateStr?: string): string | null {
  if (!dateStr) return null
  return dateStr.slice(0, 4)
}

export function kinFullName(kin: Pick<Kin, 'givenName' | 'middleName' | 'surname'>): string {
  return [kin.givenName, kin.middleName, kin.surname].filter(Boolean).join(' ')
}

export const KinNode = memo(function KinNode({ data }: NodeProps<KinNodeData>) {
  const { kin, isValid, onEdit } = data
  const currentBloodline = kin.bloodlines.find(b => b.current)
  const birthYear = formatYear(kin.birthDate)
  const deathYear = formatYear(kin.deathDate)

  let dateLabel = ''
  if (birthYear && deathYear) dateLabel = `${birthYear} – ${deathYear}`
  else if (birthYear) dateLabel = `b. ${birthYear}`
  else if (deathYear) dateLabel = `d. ${deathYear}`

  return (
    <div
      className={`w-52 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${!isValid ? 'ring-2 ring-red-500/50' : ''}`}
      onClick={onEdit}
    >
      <Handle id="top" type="target" position={Position.Top} style={{ background: 'var(--border)' }} />

      <div className="px-3 py-2.5">
        <p className="text-sm font-medium leading-tight truncate">{kinFullName(kin)}</p>
        {dateLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
        )}
        {currentBloodline && (
          <div className="flex items-center gap-1 mt-1">
            <Heart className="h-2.5 w-2.5 text-rose-400 shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">{currentBloodline.kinName}</span>
          </div>
        )}
      </div>

      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: 'var(--border)' }} />
    </div>
  )
})
