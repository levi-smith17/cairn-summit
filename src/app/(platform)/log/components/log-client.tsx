'use client'

import { useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogDrawer } from '@/components/drawers/log-drawer'
import { LogCard } from './log-card'
import { LogRow } from './log-row'

type View = 'list' | 'grid'

interface LogClientProps {
  logs: any[]
  folders: any[]
  waypoints: any[]
  tags: any[]
}

export function LogClient({ logs, folders, waypoints, tags }: LogClientProps) {
  const [view, setView] = useState<View>('list')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<any>(null)

  function handleEdit(log: any) {
    setEditingLog(log)
    setDrawerOpen(true)
  }

  function handleClose() {
    setDrawerOpen(false)
    setEditingLog(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground flex-1">
          {logs.length} entr{logs.length !== 1 ? 'ies' : 'y'}
        </p>

        <div className="flex items-center rounded-md border divide-x overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none ${view === 'list' ? 'bg-muted' : ''}`}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none ${view === 'grid' ? 'bg-muted' : ''}`}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Entries */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">No log entries found.</p>
        </div>
      ) : view === 'list' ? (
        <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
          {logs.map(log => (
            <LogRow key={log.id} log={log} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map(log => (
            <LogCard key={log.id} log={log} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <LogDrawer
        open={drawerOpen}
        onClose={handleClose}
        log={editingLog}
        folders={folders}
        waypoints={waypoints}
        tags={tags}
      />
    </div>
  )
}