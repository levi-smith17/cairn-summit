'use client'

import { useState } from 'react'
import { TagBadge } from './tag-badge'
import { WaypointItemActions } from './waypoint-item-actions'
import { deleteWaypoint } from '@/actions/waypoints'
import { format } from 'date-fns'

interface WaypointCardProps {
  waypoint: any
  onEdit: (waypoint: any) => void
}

export function WaypointCard({ waypoint, onEdit }: WaypointCardProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteWaypoint(waypoint.id)
  }

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${waypoint.read ? 'opacity-60' : ''}`}>
      {/* Favicon + title */}
      <div className="flex items-start gap-3">
        {waypoint.favicon && (
          <img
            src={waypoint.favicon}
            alt=""
            className="h-5 w-5 rounded mt-0.5 shrink-0"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{waypoint.title}</p>
          <p className="text-xs text-muted-foreground truncate">{waypoint.url}</p>
        </div>
      </div>

      {/* Description */}
      {waypoint.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{waypoint.description}</p>
      )}

      {/* Tags */}
      {waypoint.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {waypoint.tags.map((t: any) => (
            <TagBadge key={t.tagId} tag={t.tag} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t">
        <span className="text-xs text-muted-foreground">
          {format(new Date(waypoint.createdAt), 'MMM d, yyyy')}
        </span>
        <WaypointItemActions waypoint={waypoint} onEdit={onEdit} />
      </div>
    </div>
  )
}