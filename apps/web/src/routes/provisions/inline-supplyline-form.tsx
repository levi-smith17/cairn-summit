import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveSupplyline } from '@/lib/api/supplylines'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().min(0, 'Must be ≥ 0'),
  billingCycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  nextRenewal: z.string().min(1, 'Required'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

const BILLING_CYCLES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const
const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
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
  tags: any[]
  onSaved: () => void
  onCancel: () => void
}

export function InlineSupplylineForm({ supplyline, tags, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplyline?.name ?? '',
      amount: supplyline?.amount ?? 0,
      billingCycle: (supplyline?.billingCycle as FormValues['billingCycle']) ?? 'MONTHLY',
      nextRenewal: supplyline?.nextRenewal?.split('T')[0] ?? '',
      url: supplyline?.url ?? '',
      notes: supplyline?.notes ?? '',
      tagIds: supplyline?.markers?.map((t: any) => t.markerId) ?? [],
    },
  })

  const selectedTagIds = form.watch('tagIds')
  const billingCycle = form.watch('billingCycle')

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveSupplyline({
        id: supplyline?.id,
        name: values.name,
        amount: values.amount,
        billingCycle: values.billingCycle,
        nextRenewal: values.nextRenewal,
        url: values.url || null,
        notes: values.notes || null,
        markerIds: values.tagIds,
      })
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-muted/30 border-b">
      <div className="flex flex-col gap-2 flex-wrap p-4">
        <Input
          placeholder="Name"
          className="grow h-9 md:h-8 text-sm"
          {...form.register('name')}
        />
        <div className="flex flex-col lg:flex-row gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-9 md:h-8 text-sm"
            {...form.register('amount', {
              valueAsNumber: true,
              setValueAs: (v) => (v === '' ? 0 : parseFloat(v)),
            })}
          />
          <CustomSelect
            options={BILLING_CYCLES.map(c => ({ value: c, label: CYCLE_LABELS[c] }))}
            value={billingCycle}
            onChange={v => form.setValue('billingCycle', v as FormValues['billingCycle'])}
          />
          <Input
            type="date"
            className="h-9 md:h-8 text-sm"
            {...form.register('nextRenewal')}
          />
        </div>
        <MarkerPicker
          markers={tags}
          selected={selectedTagIds}
          onChange={ids => form.setValue('tagIds', ids)}
          placeholder="Select marker…"
          singleSelect
          initialPath={['Provisions']}
        />
        <Input
          placeholder="URL (optional)"
          className="grow h-9 md:h-8 text-sm"
          {...form.register('url')}
        />
        <Input
          placeholder="Notes (optional)"
          className="grow h-9 md:h-8 text-sm m-0"
          {...form.register('notes')}
        />
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-end gap-2 p-4 md:py-2 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-9 md:h-7 text-xs">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving} className="h-9 md:h-7 text-xs">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
