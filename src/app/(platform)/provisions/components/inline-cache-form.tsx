'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { saveBudget } from '@/actions/budgets'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  category: z.string().min(1, 'Required'),
  limit: z.number().positive('Must be > 0'),
})

type FormValues = z.infer<typeof schema>

interface Budget {
  id: string
  category: string
  limit: number
  spent: number
  utilization: number
}

interface Props {
  budget?: Budget
  categories: string[]
  month: number
  year: number
  onSaved: () => void
  onCancel: () => void
}

export function InlineCacheForm({ budget, categories, month, year, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: budget?.category ?? '',
      limit: budget?.limit ?? undefined,
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveBudget({
        id: budget?.id,
        category: values.category,
        limit: values.limit,
        month,
        year,
      })
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 bg-muted/30 border-b space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Category"
          list="inline-cache-categories"
          className="flex-1 h-8 text-sm"
          {...form.register('category')}
        />
        <datalist id="inline-cache-categories">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="500.00"
          className="w-28 h-8 text-sm"
          {...form.register('limit', {
            valueAsNumber: true,
            setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
          })}
        />
      </div>
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
