import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  CreditCard,
  Mail,
  ChevronRight,
  MapPin,
  CalendarDays,
  Lock,
  Globe,
  Link2,
  GitBranch,
} from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'
import { fetchExternalCalendarEvents } from '@/lib/api/basecamp'
import { cardHoverBorder, cn } from '@/lib/utils'

export interface SnapshotData {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    username: string | null
    origins: {
      headline: string | null
      location: string | null
      website: string | null
      linkedin: string | null
      github: string | null
    } | null
  }
  provisionsSummary: {
    monthlyTotal: number
    monthlyBurn: number
    cacheTotalLimit: number
    cacheTotalSpent: number
    activeCount: number
    upcomingRenewals: number
  }
  itinerarySummary: {
    stops: {
      id: string
      title: string
      startDate: Date | string
      endDate: Date | string | null
      allDay: boolean
      color: string
    }[]
  }
  signalsSummary: {
    unreadCount: number
    latestMessages: {
      id: string
      senderName: string
      body: string
      createdAt: string
      read: boolean
    }[]
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function SnapshotSkeleton() {
  return (
    <div className="min-h-[11rem] animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="mb-3 h-3 w-20 rounded bg-muted" />
      <div className="h-4 w-28 rounded bg-muted" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/5 rounded bg-muted" />
      </div>
    </div>
  )
}

function PanelShell({
  href,
  label,
  icon: Icon,
  children,
}: {
  href: string
  label: string
  icon: typeof User
  children: React.ReactNode
}) {
  return (
    <Link
      to={href}
      className={cn(
        'group flex min-h-[11rem] flex-col rounded-lg border bg-card p-4 hover:bg-muted/40',
        cardHoverBorder,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </Link>
  )
}

export function SnapshotPanels({
  wayfarer,
  provisionsSummary,
  itinerarySummary,
  signalsSummary,
  isLoading = false,
}: SnapshotData & { isLoading?: boolean }) {
  const { terms, terminology } = useTerminology()
  const wayfarerLabel = terminology === 'CAIRN' ? 'Wayfarer' : 'Profile'

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return [...itinerarySummary.stops]
      .map((stop) => ({
        ...stop,
        start: new Date(stop.startDate),
      }))
      .filter((stop) => stop.start >= now || stop.allDay)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3)
  }, [itinerarySummary.stops])

  const externalQuery = useQuery({
    queryKey: ['itinerary-events', 'basecamp-snapshot-compact'],
    queryFn: fetchExternalCalendarEvents,
    staleTime: 5 * 60 * 1000,
  })

  const externalUpcoming = useMemo(() => {
    const now = new Date()
    return (externalQuery.data ?? [])
      .map((event) => ({
        key: event.uid,
        title: event.title,
        start: new Date(event.startDate),
        color: event.color,
        readonly: event.readonly,
      }))
      .filter((event) => event.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3)
  }, [externalQuery.data])

  const displayEvents =
    upcomingEvents.length > 0
      ? upcomingEvents.map((e) => ({
          key: e.id,
          title: e.title,
          start: e.start,
          color: e.color,
          readonly: false,
        }))
      : externalUpcoming

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SnapshotSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <PanelShell href="/manifest" label={wayfarerLabel} icon={User}>
        <div className="mb-3 flex items-center gap-3">
          {wayfarer.image ? (
            <img src={wayfarer.image} alt="" className="h-10 w-10 shrink-0 rounded-full" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{wayfarer.name ?? 'No name set'}</p>
            {wayfarer.origins?.headline ? (
              <p className="truncate text-xs text-muted-foreground">{wayfarer.origins.headline}</p>
            ) : null}
          </div>
        </div>
        <div className="mb-3 border-t border-border" />
        <div className="flex flex-col gap-1.5">
          {wayfarer.email ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{wayfarer.email}</span>
            </div>
          ) : null}
          {wayfarer.origins?.location ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{wayfarer.origins.location}</span>
            </div>
          ) : null}
          {wayfarer.origins?.website ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{wayfarer.origins.website}</span>
            </div>
          ) : null}
          {wayfarer.origins?.linkedin ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{wayfarer.origins.linkedin}</span>
            </div>
          ) : null}
          {wayfarer.origins?.github ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3 shrink-0" />
              <span className="truncate">{wayfarer.origins.github}</span>
            </div>
          ) : null}
        </div>
      </PanelShell>

      <PanelShell href="/provisions" label={terms.provisions} icon={CreditCard}>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{terms.supplylines}</span>
            <span className="truncate font-medium tabular-nums">
              {fmt(provisionsSummary.monthlyTotal)}
              <span className="font-normal text-muted-foreground">
                {' '}
                · {provisionsSummary.activeCount} active
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{terms.burn}</span>
            <span className="font-medium tabular-nums">{fmt(provisionsSummary.monthlyBurn)}</span>
          </div>
          {provisionsSummary.cacheTotalLimit > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{terms.cache}</span>
              <span className="truncate font-medium tabular-nums">
                {fmt(provisionsSummary.cacheTotalSpent)}
                <span className="font-normal text-muted-foreground">
                  {' '}
                  / {fmt(provisionsSummary.cacheTotalLimit)}
                </span>
              </span>
            </div>
          ) : null}
          {provisionsSummary.upcomingRenewals > 0 ? (
            <p className="text-amber-600 dark:text-amber-400">
              {provisionsSummary.upcomingRenewals} renewal
              {provisionsSummary.upcomingRenewals !== 1 ? 's' : ''} soon
            </p>
          ) : null}
        </div>
      </PanelShell>

      <PanelShell href="/itinerary" label={terms.itinerary} icon={CalendarDays}>
        {displayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No upcoming events</p>
        ) : (
          <ul className="space-y-1">
            {displayEvents.map((event) => (
              <li key={event.key} className="flex items-start gap-1.5 text-xs">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <span className="min-w-0 truncate">
                  <span className="font-medium">{event.title}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    ·{' '}
                    {event.start.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </span>
                {event.readonly ? (
                  <Lock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </PanelShell>

      <PanelShell href="/signals" label={terms.signals} icon={Mail}>
        {signalsSummary.latestMessages.length === 0 ? (
          <p className="text-xs text-muted-foreground">No messages yet</p>
        ) : (
          <div className="space-y-1.5">
            {signalsSummary.unreadCount > 0 ? (
              <p className="text-xs font-medium text-primary">
                {signalsSummary.unreadCount} unread
              </p>
            ) : null}
            {signalsSummary.latestMessages.slice(0, 2).map((message) => (
              <p
                key={message.id}
                className={cn(
                  'truncate text-xs',
                  message.read ? 'text-muted-foreground' : 'font-medium',
                )}
              >
                {message.senderName}: {message.body}
              </p>
            ))}
          </div>
        )}
      </PanelShell>
    </div>
  )
}
