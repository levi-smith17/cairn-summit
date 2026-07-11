import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveCache } from '@/lib/api/supplylines'
import { useFormStatus } from '@/hooks/use-form-status'

const schema = z.object({
  markerId: z.string().min(1, 'Required'),
  limit: z.number().positive('Must be > 0'),
})

type FormValues = z.infer<typeof schema>

interface cache {
  id: string
  markerId: string
  limit: number
  spent: number
  utilization: number
}

interface Props {
  cache?: cache
  markers: any[]
  month: number
  year: number
  defaultMarkerId?: string
  onSaved: () => void
  onCancel: () => void
}

export function InlineCacheForm({ cache, markers, month, year, defaultMarkerId, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      markerId: cache?.markerId ?? defaultMarkerId ?? '',
      limit: cache?.limit ?? undefined,
    },
  })

  const markerId = form.watch('markerId')

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveCache({
        id: cache?.id,
        markerId: values.markerId,
        limit: values.limit,
        month,
        year,
      })
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-muted/30 border-b">
      <div className="flex gap-2 items-center p-4">
        <div className="flex-1">
          <MarkerPicker
            markers={markers}
            selected={markerId ? [markerId] : []}
            onChange={ids => form.setValue('markerId', ids[0] ?? '')}
            placeholder="Select marker…"
            singleSelect
            initialPath={['Provisions']}
          />
        </div>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="500.00"
          className="w-28 h-9 md:h-8 text-sm"
          {...form.register('limit', {
            valueAsNumber: true,
            setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
          })}
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
