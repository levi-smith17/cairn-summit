'use client'

import { useState } from 'react'
import { FolderRow } from './folder-row'
import { FolderDrawer } from '@/components/drawers/folder-drawer'

interface FoldersClientProps {
  folders: {
    id: string
    name: string
    _count: { waypoints: number }
  }[]
}

export function FoldersClient({ folders }: FoldersClientProps) {
  const [editingFolder, setEditingFolder] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleEdit(folder: any) {
    setEditingFolder(folder)
    setDrawerOpen(true)
  }

  function handleClose() {
    setDrawerOpen(false)
    setEditingFolder(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">
        {folders.length} folder{folders.length !== 1 ? 's' : ''}
      </p>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">No folders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
          {folders.map(folder => (
            <FolderRow key={folder.id} folder={folder} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <FolderDrawer open={drawerOpen} onClose={handleClose} folder={editingFolder} />
    </div>
  )
}