'use client'

import { useState } from 'react'
import { TagBadge } from './tag-badge'
import { WaypointItemActions } from './waypoint-item-actions'
import { deleteWaypoint } from '@/actions/waypoints'
import { format } from 'date-fns'

interface WaypointRowProps {
  waypoint: any
  onEdit: (waypoint: any) => void
}

export function WaypointRow({ waypoint, onEdit }: WaypointRowProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteWaypoint(waypoint.id)
  }

  return (
    <div className={`flex items-center gap-4 px-4 py-3 ${waypoint.read ? 'opacity-60' : ''}`}>
      {/* Favicon */}
      {waypoint.favicon && (
        <img
          src={waypoint.favicon}
          alt=""
          className="h-4 w-4 rounded shrink-0"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}

      {/* Title + URL */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{waypoint.title}</p>
        <p className="text-xs text-muted-foreground truncate">{waypoint.url}</p>
      </div>

      {/* Tags */}
      <div className="hidden md:flex flex-wrap gap-1 shrink-0">
        {waypoint.tags.slice(0, 3).map((t: any) => (
          <TagBadge key={t.tagId} tag={t.tag} />
        ))}
      </div>

      {/* Folder */}
      {waypoint.folder && (
        <span className="hidden lg:block text-xs text-muted-foreground shrink-0">
          {waypoint.folder.name}
        </span>
      )}

      {/* Date */}
      <span className="hidden lg:block text-xs text-muted-foreground shrink-0">
        {format(new Date(waypoint.createdAt), 'MMM d, yyyy')}
      </span>

      {/* Actions */}
      <WaypointItemActions waypoint={waypoint} onEdit={onEdit} />
    </div>
  )
}