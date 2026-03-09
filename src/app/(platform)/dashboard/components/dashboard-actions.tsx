'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaypointDrawer } from '@/components/drawers/waypoint-drawer'
import { LogDrawer } from '@/components/drawers/log-drawer'

interface DashboardActionsProps {
  folders: any[]
  tags: any[]
}

export function DashboardActions({ folders, tags }: DashboardActionsProps) {
  const [waypointDrawerOpen, setWaypointDrawerOpen] = useState(false)
  const [logDrawerOpen, setLogDrawerOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setLogDrawerOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Note
      </Button>

      <Button
        size="sm"
        onClick={() => setWaypointDrawerOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Waypoint
      </Button>

      <WaypointDrawer
        open={waypointDrawerOpen}
        onClose={() => setWaypointDrawerOpen(false)}
        folders={folders}
        tags={tags}
      />

      <LogDrawer
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        folders={folders}
        waypoints={[]}
        tags={tags}
      />
    </>
  )
}