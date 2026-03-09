'use client'

import { useState } from 'react'
import { TagRow } from './tag-row'
import { TagDrawer } from '@/components/drawers/tag-drawer'

interface TagsClientProps {
  tags: {
    id: string
    name: string
    color: string
    icon: string | null
    _count: { waypoints: number }
  }[]
}

export function TagsClient({ tags }: TagsClientProps) {
  const [editingTag, setEditingTag] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleEdit(tag: any) {
    setEditingTag(tag)
    setDrawerOpen(true)
  }

  function handleClose() {
    setDrawerOpen(false)
    setEditingTag(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">
        {tags.length} tag{tags.length !== 1 ? 's' : ''}
      </p>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">No tags yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
          {tags.map(tag => (
            <TagRow key={tag.id} tag={tag} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <TagDrawer open={drawerOpen} onClose={handleClose} tag={editingTag} />
    </div>
  )
}