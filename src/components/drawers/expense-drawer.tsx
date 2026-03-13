'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/forms/form-actions'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveExpense } from '@/actions/expenses'
import { Camera, X, Receipt } from 'lucide-react'

const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseDrawerProps {
  open: boolean
  onClose: () => void
  expense?: any
  categories: string[]
  tags: any[]
}

export function ExpenseDrawer({
  open,
  onClose,
  expense,
  categories,
  tags,
}: ExpenseDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptKey, setReceiptKey] = useState<string | null>(
    expense?.receiptUrl ?? null
  )
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: expense?.name ?? '',
      amount: expense?.amount as number | undefined,
      category: expense?.category ?? '',
      date: expense?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      notes: expense?.notes ?? '',
      tagIds: expense?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: expense?.name ?? '',
        amount: expense?.amount as number | undefined,
        category: expense?.category ?? '',
        date: expense?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        notes: expense?.notes ?? '',
        tagIds: expense?.tags?.map((t: any) => t.tagId) ?? [],
      })
      setReceiptKey(expense?.receiptUrl ?? null)
      setReceiptPreview(null)
    }
  }, [open, expense])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      setReceiptKey(null)
      setReceiptPreview(null)
      onClose()
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setReceiptPreview(URL.createObjectURL(file))

    // Upload to R2
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.key) {
        setReceiptKey(data.key)
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveReceipt() {
    setReceiptKey(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(values: ExpenseFormValues) {
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
      form.reset()
      setReceiptKey(null)
      setReceiptPreview(null)
      onClose()
    })
  }

  function toggleTag(tagId: string) {
    const current = form.getValues('tagIds')
    form.setValue(
      'tagIds',
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    )
  }

  const selectedTagIds = form.watch('tagIds')

  // Derive the filename from the key for the secure serving route
  const receiptFilename = receiptKey?.split('/').pop()

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{expense ? 'Edit Expense' : 'Log Expense'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form
              id="expense-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grocery run" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="42.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Food"
                        list="expense-categories"
                        {...field}
                      />
                    </FormControl>
                    <datalist id="expense-categories">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any notes..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt Upload */}
              <div className="space-y-2">
                <FormLabel>Receipt (optional)</FormLabel>
                {receiptPreview || receiptFilename ? (
                  <div className="relative">
                    <img
                      src={receiptPreview ?? `/api/receipts/${receiptFilename}`}
                      alt="Receipt"
                      className="w-full rounded-lg border object-cover max-h-48"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveReceipt}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {uploading && (
                      <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Receipt className="h-6 w-6" />
                    <span className="text-sm">Upload or take a photo</span>
                    <span className="text-xs">JPEG, PNG, WEBP up to 10MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {tags.length > 0 && (
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`rounded-full transition-opacity ${
                              selectedTagIds.includes(tag.id)
                                ? 'opacity-100 ring-2 ring-offset-1'
                                : 'opacity-50'
                            }`}
                            style={{ ['--tw-ring-color' as any]: tag.color }}
                          >
                            <MarkerBadge marker={tag} />
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving || uploading}
            saved={saved}
            error={error}
            saveLabel={expense ? 'Save Changes' : 'Log Expense'}
            formId="expense-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}