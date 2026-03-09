'use client'

import { useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaypointCard } from './waypoint-card'
import { WaypointDrawer } from '@/components/drawers/waypoint-drawer'
import { WaypointRow } from './waypoint-row'

type View = 'grid' | 'list'

interface WaypointsClientProps {
  waypoints: any[]
  folders: any[]
  tags: any[]
}

export function WaypointsClient({ waypoints, folders, tags }: WaypointsClientProps) {
  const [view, setView] = useState<View>('grid')
  const [showForm, setShowForm] = useState(false)
  const [editingWaypoint, setEditingWaypoint] = useState<any>(null)

  function handleEdit(waypoint: any) {
    setEditingWaypoint(waypoint)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingWaypoint(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground flex-1">
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center rounded-md border divide-x overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none ${view === 'grid' ? 'bg-muted' : ''}`}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none ${view === 'list' ? 'bg-muted' : ''}`}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Waypoints */}
      {waypoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">No waypoints found.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {waypoints.map(w => (
            <WaypointCard key={w.id} waypoint={w} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
          {waypoints.map(w => (
            <WaypointRow key={w.id} waypoint={w} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <WaypointDrawer
        open={showForm}
        onClose={handleCloseForm}
        waypoint={editingWaypoint}
        folders={folders}
        tags={tags}
      />
    </div>
  )
}