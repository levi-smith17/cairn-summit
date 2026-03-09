'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FolderDrawer } from '@/components/drawers/folder-drawer'

export function NewFolderButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Folder
      </Button>
      <FolderDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}