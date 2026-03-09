'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TagDrawer } from '@/components/drawers/tag-drawer'

export function NewTagButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Tag
      </Button>
      <TagDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}