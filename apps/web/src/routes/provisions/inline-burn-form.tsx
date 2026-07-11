import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { saveBurn, getBurnReceiptUploadUrl, getBurnReceiptUrl } from '@/lib/api/supplylines'
import { useFormStatus } from '@/hooks/use-form-status'
import { toMarkerId } from '@/lib/embedded-markers'
import { ImagePlus, X } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().min(0, 'Must be ≥ 0'),
  date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface Marker {
  markerId: string
  marker: { id: string; name: string; color: string; icon?: string }
}

interface Burn {
  id: string
  name: string
  amount: number
  date: string
  notes?: string
  receiptUrl?: string | null
  markers: Marker[]
}

interface Props {
  burn?: Burn
  tags: any[]
  defaultMarkerId?: string
  onSaved: () => void
  onCancel: () => void
}

export function InlineBurnForm({ burn, tags, defaultMarkerId, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptKey, setReceiptKey] = useState<string | null>(burn?.receiptUrl ?? null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptViewUrl, setReceiptViewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: burn?.name ?? '',
      amount: burn?.amount ?? 0,
      date: burn?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      notes: burn?.notes ?? '',
      tagIds: burn?.markers?.map((t: any) => toMarkerId(t)).filter(Boolean) as string[]
        ?? (defaultMarkerId ? [defaultMarkerId] : []),
    },
  })

  const selectedTagIds = form.watch('tagIds')

  useEffect(() => {
    if (burn?.receiptUrl && !receiptPreview) {
      getBurnReceiptUrl(burn.receiptUrl).then(setReceiptViewUrl).catch(() => {})
    }
  }, [burn?.receiptUrl])

  async function uploadFile(file: File) {
    const localUrl = URL.createObjectURL(file)
    setReceiptPreview(localUrl)
    setReceiptViewUrl(null)
    setUploading(true)
    try {
      const { url, key } = await getBurnReceiptUploadUrl(file.type, file.size)
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      setReceiptKey(key)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveBurn({
        id: burn?.id,
        name: values.name,
        amount: values.amount,
        date: values.date,
        notes: values.notes || null,
        markerIds: values.tagIds,
        receiptUrl: receiptKey,
      })
      onSaved()
    })
  }

  const receiptSrc = receiptPreview ?? receiptViewUrl

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-muted/30 border-b">
      <div className="flex flex-col gap-2 p-4">
        <Input
          placeholder="Description"
          className="h-9 md:h-8 text-sm"
          {...form.register('name')}
        />
        <div className="flex flex-col lg:flex-row gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="grow h-9 md:h-8 text-sm"
            {...form.register('amount', {
              valueAsNumber: true,
              setValueAs: (v) => (v === '' ? 0 : parseFloat(v)),
            })}
          />
          <Input
            type="date"
            className="grow w-full min-w-0 h-9 md:h-8 text-sm"
            {...form.register('date')}
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
          placeholder="Notes (optional)"
          className="h-9 md:h-8 text-sm"
          {...form.register('notes')}
        />
      </div>

      <div className="p-4 border-t">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {receiptSrc ? (
          <div className="relative w-full rounded-lg overflow-hidden border bg-muted">
            <img
              src={receiptSrc}
              alt="Receipt"
              className="w-full max-h-64 object-contain"
            />
            <button
              type="button"
              onClick={() => { setReceiptKey(null); setReceiptPreview(null); setReceiptViewUrl(null) }}
              className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur p-1 text-muted-foreground hover:text-foreground border"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm text-xs text-muted-foreground">
                Uploading…
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed py-6 cursor-pointer transition-colors text-center
              ${dragging
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50 text-muted-foreground'
              }`}
          >
            <ImagePlus className="h-6 w-6" />
            <div className="text-xs">
              <span className="font-medium">Click to upload</span> or drag &amp; drop
            </div>
            <p className="text-xs opacity-60">PNG, JPG, HEIC up to 10MB</p>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-end gap-2 p-4 md:py-2 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-9 md:h-7 text-xs">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || uploading} className="h-9 md:h-7 text-xs">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
