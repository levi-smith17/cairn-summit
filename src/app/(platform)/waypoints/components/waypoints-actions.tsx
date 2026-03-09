'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaypointDrawer } from '@/components/drawers/waypoint-drawer'
import { useRouter } from 'next/navigation'

interface WaypointsActionsProps {
  folders: any[]
  tags: any[]
}

export function WaypointsActions({ folders, tags }: WaypointsActionsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setDrawerOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Waypoint
      </Button>

      <WaypointDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        folders={folders}
        tags={tags}
      />
    </>
  )
}