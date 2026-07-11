import { useState, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveCache } from '@/lib/api/supplylines'
import { useFormStatus } from '@/hooks/use-form-status'
import { useTerminology } from '@/contexts/terminology-context'

interface CacheItem {
  id: string
  markerId: string
  limit: number
  spent: number
  utilization: number
}

interface Props {
  cache?: CacheItem
  markers: { id: string; name: string; color: string; icon?: string | null }[]
  month: number
  year: number
  defaultMarkerId?: string
  formId?: string
  onSaved: () => void
  onCancel?: () => void
}

export function InlineCacheForm({
  cache,
  markers,
  month,
  year,
  defaultMarkerId,
  formId: formIdProp,
  onSaved,
  onCancel,
}: Props) {
  const { terms } = useTerminology()
  const generatedId = useId()
  const formId = formIdProp ?? generatedId
  const { saving, handleSubmit } = useFormStatus()
  const [markerId, setMarkerId] = useState(cache?.markerId ?? defaultMarkerId ?? '')
  const [limit, setLimit] = useState(cache?.limit != null ? String(cache.limit) : '')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!markerId || !limit) return
    await handleSubmit(async () => {
      await saveCache({
        id: cache?.id,
        markerId,
        limit: parseFloat(limit),
        month,
        year,
      })
      onSaved()
    })
  }

  const form = (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 px-5 py-4 text-sm">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.markers}</span>
        <MarkerPicker
          markers={markers}
          selected={markerId ? [markerId] : []}
          onChange={(ids) => setMarkerId(ids[0] ?? '')}
          placeholder={`Select ${terms.markers.toLowerCase()}…`}
          singleSelect
          initialPath={['Provisions']}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Monthly limit</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="500.00"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
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
