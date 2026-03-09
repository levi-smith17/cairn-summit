'use client'

import { useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BillingCycle } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/forms/form-actions'
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveProvision } from '@/actions/provisions'

const provisionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  billingCycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  nextRenewal: z.string().min(1, 'Next renewal date is required'),
  category: z.string().min(1, 'Category is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  tagIds: z.array(z.string()),
})

type ProvisionFormValues = z.infer<typeof provisionSchema>

const BILLING_CYCLES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const
const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
}

interface ProvisionDrawerProps {
  open: boolean
  onClose: () => void
  provision?: any
  categories: string[]
  tags: any[]
}

export function ProvisionDrawer({
  open,
  onClose,
  provision,
  categories,
  tags,
}: ProvisionDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      name: provision?.name ?? '',
      amount: provision?.amount ?? '',
      billingCycle: provision?.billingCycle ?? 'MONTHLY',
      nextRenewal: provision?.nextRenewal?.split('T')[0] ?? '',
      category: provision?.category ?? '',
      url: provision?.url ?? '',
      notes: provision?.notes ?? '',
      tagIds: provision?.tags?.map((t: any) => t.tagId) ?? [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: provision?.name ?? '',
        amount: provision?.amount ?? '',
        billingCycle: provision?.billingCycle ?? 'MONTHLY',
        nextRenewal: provision?.nextRenewal?.split('T')[0] ?? '',
        category: provision?.category ?? '',
        url: provision?.url ?? '',
        notes: provision?.notes ?? '',
        tagIds: provision?.tags?.map((t: any) => t.tagId) ?? [],
      })
    }
  }, [open, provision])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: ProvisionFormValues) {
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
        tagIds: values.tagIds,
      })
      form.reset()
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

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{provision ? 'Edit Subscription' : 'New Subscription'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form
              id="provision-form"
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
                      <Input placeholder="Netflix" {...field} />
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
                        <Input type="number" min="0" step="0.01" placeholder="9.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Cycle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BILLING_CYCLES.map((c) => (
                            <SelectItem key={c} value={c}>{CYCLE_LABELS[c]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nextRenewal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Renewal</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Entertainment"
                          list="provision-categories"
                          {...field}
                        />
                      </FormControl>
                      <datalist id="provision-categories">
                        {categories.map((c) => <option key={c} value={c} />)}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
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
                            <TagBadge tag={tag} />
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
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={provision ? 'Save Changes' : 'Add Subscription'}
            formId="provision-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}