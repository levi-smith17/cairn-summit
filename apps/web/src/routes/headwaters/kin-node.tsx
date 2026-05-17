import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { AlertCircle, Heart, User } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { KinPicker } from '@/components/ui/kin-picker'
import type { Kin } from '@cairn/types'

export interface ParentUpdate {
  fatherId?: string
  fatherUnknown: boolean
  motherId?: string
  motherUnknown: boolean
}

export interface KinNodeData {
  kin: Kin & { id: string }
  isValid: boolean
  isHighlighted: boolean
  allKin: (Kin & { id: string })[]
  onEdit: () => void
  onQuickParentFix: (update: ParentUpdate) => Promise<void>
}

function formatYear(dateStr?: string): string | null {
  if (!dateStr) return null
  return dateStr.slice(0, 4)
}

export function kinFullName(kin: Pick<Kin, 'givenName' | 'middleName' | 'surname'>): string {
  return [kin.givenName, kin.middleName, kin.surname].filter(Boolean).join(' ')
}

export function kinDisplayName(kin: Pick<Kin, 'givenName' | 'middleName' | 'surname' | 'nickname'>): string {
  const full = kinFullName(kin)
  return kin.nickname ? `${full} (${kin.nickname})` : full
}

const MIN_PARENT_AGE_GAP = 13

export function isEligibleParent(candidate: { birthDate?: string }, child: { birthDate?: string }): boolean {
  if (!candidate.birthDate || !child.birthDate) return true
  const candidateYear = parseInt(candidate.birthDate.slice(0, 4), 10)
  const childYear = parseInt(child.birthDate.slice(0, 4), 10)
  if (isNaN(candidateYear) || isNaN(childYear)) return true
  return childYear - candidateYear >= MIN_PARENT_AGE_GAP
}

export function getDescendantIds(kinId: string, allKin: (Kin & { id: string })[]): Set<string> {
  const childrenOf = new Map<string, string[]>()
  for (const k of allKin) {
    if (k.fatherId) {
      const list = childrenOf.get(k.fatherId) ?? []; list.push(k.id); childrenOf.set(k.fatherId, list)
    }
    if (k.motherId) {
      const list = childrenOf.get(k.motherId) ?? []; list.push(k.id); childrenOf.set(k.motherId, list)
    }
  }
  const descendants = new Set<string>()
  const queue = [kinId]
  while (queue.length > 0) {
    const id = queue.shift()!
    for (const child of childrenOf.get(id) ?? []) {
      if (!descendants.has(child)) { descendants.add(child); queue.push(child) }
    }
  }
  return descendants
}

interface QuickParentFixProps {
  kin: Kin & { id: string }
  allKin: (Kin & { id: string })[]
  onSave: (update: ParentUpdate) => Promise<void>
}

function QuickParentFix({ kin, allKin, onSave }: QuickParentFixProps) {
  const [open, setOpen] = useState(false)
  const [fatherId, setFatherId] = useState(kin.fatherId ?? '')
  const [fatherUnknown, setFatherUnknown] = useState(kin.fatherUnknown)
  const [motherId, setMotherId] = useState(kin.motherId ?? '')
  const [motherUnknown, setMotherUnknown] = useState(kin.motherUnknown)
  const [saving, setSaving] = useState(false)

  const descendantIds = getDescendantIds(kin.id, allKin)
  const eligibleParents = allKin.filter(k =>
    k.id !== kin.id && !descendantIds.has(k.id) && isEligibleParent(k, kin)
  )
  const toOption = (k: Kin & { id: string }) => ({ value: k.id, label: kinDisplayName(k) })
  const sortedEligible = eligibleParents.map(toOption).sort((a, b) => a.label.localeCompare(b.label))
  const fatherOptions = [{ value: '', label: 'None' }, ...sortedEligible.filter(o => o.value !== motherId)]
  const motherOptions = [{ value: '', label: 'None' }, ...sortedEligible.filter(o => o.value !== fatherId)]

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        fatherId: fatherUnknown ? undefined : (fatherId || undefined),
        fatherUnknown,
        motherId: motherUnknown ? undefined : (motherId || undefined),
        motherUnknown,
      })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="absolute top-1.5 right-1.5 z-10"
      onClick={e => e.stopPropagation()}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="h-5 w-5 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
            title="Set parents"
          >
            <AlertCircle className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 bg-secondary border-border" align="end" side="left">
          <p className="text-xs font-medium mb-3">Set Parents</p>

          <div className="space-y-1.5 mb-3">
            <p className="text-xs text-muted-foreground">Father</p>
            <KinPicker
              value={fatherId}
              onChange={setFatherId}
              options={fatherOptions}
              placeholder="Select father…"
              disabled={fatherUnknown}
              triggerClassName="w-full"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={fatherUnknown}
                onCheckedChange={checked => {
                  setFatherUnknown(!!checked)
                  if (checked) setFatherId('')
                }}
              />
              <span className="text-xs text-muted-foreground">Unknown</span>
            </label>
          </div>

          <div className="space-y-1.5 mb-4">
            <p className="text-xs text-muted-foreground">Mother</p>
            <KinPicker
              value={motherId}
              onChange={setMotherId}
              options={motherOptions}
              placeholder="Select mother…"
              disabled={motherUnknown}
              triggerClassName="w-full"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={motherUnknown}
                onCheckedChange={checked => {
                  setMotherUnknown(!!checked)
                  if (checked) setMotherId('')
                }}
              />
              <span className="text-xs text-muted-foreground">Unknown</span>
            </label>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full h-8 text-sm"
            disabled={saving || (!fatherId && !fatherUnknown && !motherId && !motherUnknown)}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export const KinNode = memo(function KinNode({ data }: NodeProps<KinNodeData>) {
  const { kin, isValid, isHighlighted, allKin, onEdit, onQuickParentFix } = data
  const currentBloodline = kin.bloodlines.find(b => b.current)
  const birthYear = formatYear(kin.birthDate)
  const deathYear = formatYear(kin.deathDate)

  let dateLabel = ''
  if (birthYear && deathYear) dateLabel = `${birthYear} – ${deathYear}`
  else if (birthYear) dateLabel = `b. ${birthYear}`
  else if (deathYear) dateLabel = `d. ${deathYear}`

  const ringClass = isHighlighted
    ? 'ring-2 ring-amber-400/80'
    : !isValid
    ? 'ring-2 ring-red-500/50'
    : 'ring-1 ring-green-500/40'

  return (
    <div
      className={`relative w-52 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${ringClass}`}
      onClick={onEdit}
    >
      <Handle id="top" type="target" position={Position.Top} style={{ background: 'var(--border)' }} />

      {!isValid && (
        <QuickParentFix
          kin={kin}
          allKin={allKin}
          onSave={onQuickParentFix}
        />
      )}

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-sm font-medium leading-tight truncate">{kinDisplayName(kin)}</p>
        </div>
        {dateLabel && (
          <p className="text-xs text-muted-foreground mt-0.5 pl-5">{dateLabel}</p>
        )}
        {currentBloodline && (
          <div className="flex items-center gap-1 mt-1 pl-5">
            <Heart className="h-2.5 w-2.5 text-rose-400 shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">
              {currentBloodline.kinName}{currentBloodline.startDate ? ` (m. ${currentBloodline.startDate.slice(0, 4)})` : ''}
            </span>
          </div>
        )}
      </div>

      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: 'var(--border)' }} />
    </div>
  )
})
