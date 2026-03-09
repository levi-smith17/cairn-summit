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
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { saveBudget } from '@/actions/budgets'

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.coerce.number().positive('Limit must be greater than 0'),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

interface BudgetDrawerProps {
  open: boolean
  onClose: () => void
  budget?: any
  categories: string[]
  month: number
  year: number
}

export function BudgetDrawer({
  open,
  onClose,
  budget,
  categories,
  month,
  year,
}: BudgetDrawerProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: budget?.category ?? '',
      limit: budget?.limit ?? undefined,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        category: budget?.category ?? '',
        limit: budget?.limit ?? undefined,
      })
    }
  }, [open, budget])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  async function onSubmit(values: BudgetFormValues) {
    await handleSubmit(async () => {
      await saveBudget({
        id: budget?.id,
        category: values.category,
        limit: values.limit,
        month,
        year,
      })
      form.reset()
      onClose()
    })
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="h-full w-96 flex flex-col">
        <DrawerHeader className="shrink-0 border-b">
          <DrawerTitle>{budget ? 'Edit Budget' : 'New Budget'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Form {...form}>
            <form
              id="budget-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Food"
                        list="budget-categories"
                        {...field}
                        disabled={!!budget}
                      />
                    </FormControl>
                    <datalist id="budget-categories">
                      {categories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Limit</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="shrink-0 border-t p-4">
          <FormActions
            saving={saving}
            saved={saved}
            error={error}
            saveLabel={budget ? 'Save Changes' : 'Add Budget'}
            formId="budget-form"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}