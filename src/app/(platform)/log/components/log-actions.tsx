'use client'

import { useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogDrawer } from '@/components/drawers/log-drawer'

interface LogActionsProps {
  folders: any[]
  waypoints: any[]
  tags: any[]
}

export function LogActions({ folders, waypoints, tags }: LogActionsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setDrawerOpen(true)}>
        <Plus className="h-4 w-4" />
        New Entry
      </Button>
      <LogDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        folders={folders}
        waypoints={waypoints}
        tags={tags}
      />
    </>
  )
}