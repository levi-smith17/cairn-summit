import { Settings, SlidersHorizontal } from 'lucide-react'
import { FilterInput } from '@/components/ui/filter-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { MarkerPicker } from '@/components/ui/marker-picker'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import { MarkerBadge } from '@/routes/waypoints/marker-badge'
import { useTerminology } from '@/contexts/terminology-context'
import { cardHoverBorder, cn } from '@/lib/utils'

export const WAYPOINT_FILTER_ALL = '__all__'
export const WAYPOINT_UNASSIGNED_TRAIL = '__unassigned__'

export type BasecampWaypoint = {
  id: string
  title: string
  url: string
  favicon: string | null
  trailId: string | null
  trailName?: string | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon?: string | null } }[]
  read?: boolean
}

export function BasecampRail({
  groups,
  selectedId,
  filterQuery,
  onFilterQueryChange,
  trailFilterId,
  onTrailFilterChange,
  markerFilterId,
  onMarkerFilterChange,
  trails,
  markers,
  onInspect,
  onOpenUrl,
  onOpenCatalog,
  isLoading,
}: {
  groups: Array<{ label: string; waypoints: BasecampWaypoint[] }>
  selectedId: string | null
  filterQuery: string
  onFilterQueryChange: (value: string) => void
  trailFilterId: string
  onTrailFilterChange: (id: string) => void
  markerFilterId: string
  onMarkerFilterChange: (id: string) => void
  trails: { id: string; name: string }[]
  markers: { id: string; name: string; color: string; icon: string | null }[]
  onInspect: (id: string) => void
  onOpenUrl: (url: string) => void
  onOpenCatalog: () => void
  isLoading?: boolean
}) {
  const { terms } = useTerminology()
  const waypointSingular = terms.waypoints.slice(0, -1) || terms.waypoints

  const trailOptions = [
    { value: WAYPOINT_FILTER_ALL, label: terms.trails },
    { value: WAYPOINT_UNASSIGNED_TRAIL, label: 'Unassigned' },
    ...trails.map((trail) => ({ value: trail.id, label: trail.name })),
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">{terms.waypoints}</span>
        <ToolbarTooltip label={`${terms.trails} & ${terms.markers}`}>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
            onClick={onOpenCatalog}
            aria-label={`${terms.trails} & ${terms.markers}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
        </ToolbarTooltip>
      </div>

      <div className="shrink-0 space-y-1.5 border-b border-border px-3 py-2">
        <FilterInput
          value={filterQuery}
          onChange={onFilterQueryChange}
          placeholder={`Filter ${terms.waypoints.toLowerCase()}…`}
        />
        <div className="flex gap-1">
          <CustomSelect
            value={trailFilterId}
            options={trailOptions}
            onChange={onTrailFilterChange}
            triggerClassName="min-w-0 flex-1"
          />
          <div className="min-w-0 flex-1">
            <MarkerPicker
              markers={markers}
              selected={markerFilterId !== WAYPOINT_FILTER_ALL ? [markerFilterId] : []}
              onChange={(ids) => onMarkerFilterChange(ids[0] ?? WAYPOINT_FILTER_ALL)}
              placeholder={terms.markers}
              singleSelect
              compact
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No {terms.waypoints.toLowerCase()} match.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <h3 className="sticky top-0 z-10 border-b border-border/60 bg-column-rail px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-1.5 p-2">
                {group.waypoints.map((waypoint) => (
                  <li key={waypoint.id}>
                    <div
                      className={cn(
                        'group relative flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs',
                        cardHoverBorder,
                        selectedId === waypoint.id
                          ? 'border-[oklch(0.45_0.1_127)] bg-primary/10 dark:border-header'
                          : '',
                        waypoint.read && 'opacity-60',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenUrl(waypoint.url)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        {waypoint.favicon ? (
                          <img
                            src={waypoint.favicon}
                            alt=""
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm bg-muted"
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {waypoint.title || waypoint.url}
                          </span>
                          {waypoint.markers.length > 0 ? (
                            <span className="mt-0.5 flex flex-wrap gap-0.5">
                              {waypoint.markers.slice(0, 2).map((entry) => (
                                <MarkerBadge key={entry.markerId} marker={entry.marker} />
                              ))}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <ToolbarTooltip label={`Edit ${waypointSingular.toLowerCase()}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onInspect(waypoint.id)
                          }}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${waypointSingular.toLowerCase()}`}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      </ToolbarTooltip>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
