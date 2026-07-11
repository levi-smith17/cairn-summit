import { useState, useId } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveSupplyline } from '@/lib/api/supplylines'
import { useFormStatus } from '@/hooks/use-form-status'
import { toMarkerId } from '@/lib/embedded-markers'
import { useTerminology } from '@/contexts/terminology-context'

const BILLING_CYCLES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const
const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
}

function todayDateInputValue(): string {
  return new Date().toISOString().split('T')[0]!
}

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.toString()
  } catch {
    return null
  }
}

interface Marker {
  markerId: string
  marker: { id: string; name: string; color: string; icon?: string }
}

interface Supplyline {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  url?: string
  notes?: string
  active: boolean
  markers: Marker[]
}

interface Props {
  supplyline?: Supplyline
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  formId?: string
  onSaved: () => void
  onCancel?: () => void
}

export function InlineSupplylineForm({
  supplyline,
  tags,
  formId: formIdProp,
  onSaved,
  onCancel,
}: Props) {
  const { terms } = useTerminology()
  const generatedId = useId()
  const formId = formIdProp ?? generatedId
  const { saving, handleSubmit } = useFormStatus()
  const [name, setName] = useState(supplyline?.name ?? '')
  const [amount, setAmount] = useState(String(supplyline?.amount ?? 0))
  const [billingCycle, setBillingCycle] = useState(supplyline?.billingCycle ?? 'MONTHLY')
  const [nextRenewal, setNextRenewal] = useState(
    supplyline?.nextRenewal?.split('T')[0] ?? todayDateInputValue(),
  )
  const [url, setUrl] = useState(supplyline?.url ?? '')
  const [notes, setNotes] = useState(supplyline?.notes ?? '')
  const [tagIds, setTagIds] = useState(
    (supplyline?.markers?.map((t) => toMarkerId(t)).filter(Boolean) as string[]) ?? [],
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (!nextRenewal) {
      toast.error('Next renewal date is required.')
      return
    }
    const normalizedUrl = normalizeOptionalUrl(url)
    if (url.trim() && !normalizedUrl) {
      toast.error('Enter a valid URL or leave the field empty.')
      return
    }

    try {
      await handleSubmit(async () => {
        await saveSupplyline({
          id: supplyline?.id,
          name: name.trim(),
          amount: parseFloat(amount) || 0,
          billingCycle,
          nextRenewal,
          url: normalizedUrl,
          notes: notes.trim() || null,
          markerIds: tagIds,
          active: supplyline?.active ?? true,
        })
        onSaved()
      })
    } catch {
      // useFormStatus already surfaced the error toast
    }
  }

  const form = (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 px-5 py-4 text-sm">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Amount</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Billing cycle</span>
        <CustomSelect
          options={BILLING_CYCLES.map((c) => ({ value: c, label: CYCLE_LABELS[c] }))}
          value={billingCycle}
          onChange={setBillingCycle}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Next renewal</span>
        <Input type="date" value={nextRenewal} onChange={(e) => setNextRenewal(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.markers}</span>
        <MarkerPicker
          markers={tags}
          selected={tagIds}
          onChange={setTagIds}
          placeholder={`Select ${terms.markers.toLowerCase()}…`}
          singleSelect
          initialPath={['Provisions']}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">URL</span>
        <Input placeholder="Optional URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {saving ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
    </form>
  )

  if (onCancel) {
    return (
      <>
        {form}
        <div className="flex justify-end gap-2 border-t p-4 py-2">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form={formId} size="sm" disabled={saving} className="h-7 text-xs">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </>
    )
  }

  return form
}
