'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { Separator } from '@/components/ui/separator'
import { saveProvision } from '@/actions/provisions'
import { useFormStatus } from '@/hooks/use-form-status'
import { BillingCycle } from '@prisma/client'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().min(0, 'Must be ≥ 0'),
  billingCycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  nextRenewal: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
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

interface Provision {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  category: string
  url?: string
  notes?: string
  active: boolean
  markers: Marker[]
}

interface Props {
  provision?: Provision
  categories: string[]
  tags: any[]
  onSaved: () => void
  onCancel: () => void
}

export function InlineSupplylineForm({ provision, categories, tags, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: provision?.name ?? '',
      amount: provision?.amount ?? 0,
      billingCycle: (provision?.billingCycle as FormValues['billingCycle']) ?? 'MONTHLY',
      nextRenewal: provision?.nextRenewal?.split('T')[0] ?? '',
      category: provision?.category ?? '',
      url: provision?.url ?? '',
      notes: provision?.notes ?? '',
      tagIds: provision?.markers?.map((t: any) => t.markerId) ?? [],
    },
  })

  const selectedTagIds = form.watch('tagIds')
  const billingCycle = form.watch('billingCycle')

  function toggleTag(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue('tagIds', current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId])
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveProvision({
        id: provision?.id,
        name: values.name,
        amount: values.amount,
        billingCycle: values.billingCycle as BillingCycle,
        nextRenewal: values.nextRenewal,
        category: values.category,
        url: values.url || null,
        notes: values.notes || null,
        markerIds: values.tagIds,
      })
      onSaved()
    })
  }

  return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 bg-muted/30 border-b space-y-2">
        <div className="flex flex-col gap-2 flex-wrap">
          <Input
              placeholder="Name"
              className="grow h-8 text-sm"
              {...form.register('name')}
          />
          <div className="flex flex-col lg:flex-row gap-2">
            <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="h-8 text-sm"
                {...form.register('amount', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' ? 0 : parseFloat(v)),
                })}
            />
            <Select
                value={billingCycle}
                onValueChange={(v) => form.setValue('billingCycle', v as FormValues['billingCycle'])}
            >
              <SelectTrigger size="sm" className="w-full h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{CYCLE_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
                type="date"
                className="h-8 text-sm"
                {...form.register('nextRenewal')}
            />
          </div>
          <Input
              placeholder="Category"
              list="inline-supplyline-categories"
              className="h-8 text-sm"
              {...form.register('category')}
          />
          <datalist id="inline-supplyline-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <Input
              placeholder="URL (optional)"
              className="grow h-8 text-sm"
              {...form.register('url')}
          />
          <Input
              placeholder="Notes (optional)"
              className="grow h-8 text-sm m-0"
              {...form.register('notes')}
          />
        </div>

        <Separator className="my-4" />

        {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                  <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full transition-opacity ${selectedTagIds.includes(tag.id) ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-50'}`}
                      style={{ ['--tw-ring-color' as any]: tag.color }}
                  >
                    <MarkerBadge marker={tag} />
                  </button>
              ))}
            </div>
        )}

        <Separator className="my-4" />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
          <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
  )
}
