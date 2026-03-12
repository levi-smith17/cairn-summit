'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ProvisionDrawer } from '@/components/drawers/provision-drawer'
import { ExpenseDrawer } from '@/components/drawers/expense-drawer'

interface Props {
  categories: string[]
  markers: any[]
}

export function ProvisionActions({ categories, markers }: Props) {
  const [provisionDrawerOpen, setProvisionDrawerOpen] = useState(false)
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setExpenseDrawerOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Log Expense
      </Button>
      <Button size="sm" onClick={() => setProvisionDrawerOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add Subscription
      </Button>

      <ProvisionDrawer
        open={provisionDrawerOpen}
        onClose={() => setProvisionDrawerOpen(false)}
        categories={categories}
        tags={markers}
      />
      <ExpenseDrawer
        open={expenseDrawerOpen}
        onClose={() => setExpenseDrawerOpen(false)}
        categories={categories}
        tags={markers}
      />
    </>
  )
}