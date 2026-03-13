'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { saveExpense } from '@/actions/expenses'
import { useFormStatus } from '@/hooks/use-form-status'
import { Paperclip, X } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  amount: z.number().positive('Must be > 0'),
  category: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface Tag {
  tagId: string
  tag: { id: string; name: string; color: string; icon?: string }
}

interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string
  notes?: string
  receiptUrl?: string | null
  tags: Tag[]
}

interface Props {
  expense?: Expense
  defaultCategory?: string
  categories: string[]
  tags: any[]
  onSaved: () => void
  onCancel: () => void
}

export function InlineExpenseForm({ expense, defaultCategory, categories, tags, onSaved, onCancel }: Props) {
  const { saving, handleSubmit } = useFormStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptKey, setReceiptKey] = useState<string | null>(expense?.receiptUrl ?? null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: expense?.name ?? '',
      amount: expense?.amount ?? undefined,
      category: expense?.category ?? defaultCategory ?? '',
      date: expense?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      notes: expense?.notes ?? '',
      tagIds: expense?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  const selectedTagIds = form.watch('tagIds')

  function toggleTag(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue('tagIds', current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/receipts/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.key) setReceiptKey(data.key)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      await saveExpense({
        id: expense?.id,
        name: values.name,
        amount: values.amount,
        category: values.category,
        date: values.date,
        notes: values.notes || null,
        tagIds: values.tagIds,
        receiptUrl: receiptKey,
      })
      onSaved()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-3 bg-muted/30 border-b space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Description"
          className="flex-1 min-w-[140px] h-8 text-sm"
          {...form.register('name')}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="w-24 h-8 text-sm"
          {...form.register('amount', { valueAsNumber: true })}
        />
        <Input
          type="date"
          className="w-36 h-8 text-sm"
          {...form.register('date')}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Category"
          list="inline-expense-categories"
          className="flex-1 min-w-[120px] h-8 text-sm"
          {...form.register('category')}
        />
        <datalist id="inline-expense-categories">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <Input
          placeholder="Notes (optional)"
          className="flex-1 min-w-[120px] h-8 text-sm"
          {...form.register('notes')}
        />
      </div>

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

      <div className="flex items-center gap-2">
        {receiptPreview || receiptKey ? (
          <div className="flex items-center gap-1.5">
            <img
              src={receiptPreview ?? `/api/receipts/${receiptKey?.split('/').pop()}`}
              alt="Receipt"
              className="h-7 w-7 object-cover rounded border"
            />
            <button
              type="button"
              onClick={() => { setReceiptKey(null); setReceiptPreview(null) }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-3 w-3" />
            {uploading ? 'Uploading…' : 'Attach receipt'}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || uploading} className="h-7 text-xs">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
