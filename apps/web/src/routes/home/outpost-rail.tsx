import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FilterInput } from '@/components/ui/filter-input'
import { useTerminology } from '@/contexts/terminology-context'
import type { OutpostWayfarer } from '@/lib/api/outpost'
import { resolveProfileImage } from '@/lib/profile-image'
import { cardHoverBorder, cn } from '@/lib/utils'

export function OutpostRail({
  wayfarers,
  selectedUsername,
  filterQuery,
  onFilterQueryChange,
  onSelect,
  isLoading,
}: {
  wayfarers: OutpostWayfarer[]
  selectedUsername: string | null
  filterQuery: string
  onFilterQueryChange: (value: string) => void
  onSelect: (username: string) => void
  isLoading?: boolean
}) {
  const { terms } = useTerminology()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <span className="text-sm font-semibold text-foreground">{terms.wayfarers}</span>
      </div>

      <div className="shrink-0 space-y-1.5 border-b border-border px-3 py-2">
        <FilterInput
          value={filterQuery}
          onChange={onFilterQueryChange}
          placeholder={`Filter by name or location…`}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : wayfarers.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No {terms.wayfarers.toLowerCase()} match.
          </p>
        ) : (
          <ul className="space-y-1.5 p-2">
            {wayfarers.map((wayfarer) => {
              const username = wayfarer.username
              if (!username) return null
              const selected = selectedUsername === username
              const name = wayfarer.name ?? wayfarer.email ?? username
              const initials = name
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const memberSince = wayfarer.memberSince
                ? format(new Date(wayfarer.memberSince), 'MMM yyyy')
                : null

              return (
                <li key={wayfarer.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(username)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg border bg-card p-2.5 text-left text-xs transition-colors',
                      cardHoverBorder,
                      selected
                        ? 'border-[oklch(0.45_0.1_127)] bg-primary/10 dark:border-header'
                        : '',
                    )}
                  >
                    <Avatar className="mt-0.5 h-9 w-9 shrink-0">
                      <AvatarImage src={resolveProfileImage(wayfarer.image) ?? undefined} alt="" />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{name}</span>
                      {wayfarer.location ? (
                        <span className="mt-0.5 block truncate text-muted-foreground">
                          {wayfarer.location}
                        </span>
                      ) : null}
                      {memberSince ? (
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          Member since {memberSince}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
