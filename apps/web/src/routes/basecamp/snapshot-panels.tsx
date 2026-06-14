import { Link } from 'react-router-dom'
import { User, BookOpen, CreditCard, Mail, ChevronRight, MapPin, Globe, Link2, GitBranch } from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'
import { ItinerarySnapshotPanel } from './itinerary-snapshot-panel'
import { SignalsSnapshotPanel } from './signals-snapshot-panel'
import { Skeleton } from '@/components/ui/skeleton'

interface SnapshotPanelsProps {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    username: string | null
    origins: { headline: string | null; location: string | null; website: string | null; linkedin: string | null; github: string | null } | null
  }
  manifestCounts: {
    expeditions: number
    training: number
    gear: number
    landmarks: number
    summits: number
    pathfinding: number
    companions: number
  }
  manifestHighlights: {
    totalYearsExperience: number
    mostRecentExpedition: { title: string; company: string } | null
    mostRecentTraining: { institution: string; degree: string | null } | null
    topGear: { name: string }[]
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
    stops: { id: string; title: string; startDate: Date | string; endDate: Date | string | null; allDay: boolean; color: string }[]
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
  isLoading?: boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function PanelSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}

export function SnapshotPanels({
  wayfarer,
  manifestCounts,
  manifestHighlights,
  provisionsSummary,
  itinerarySummary,
  signalsSummary,
  isLoading = false,
}: SnapshotPanelsProps) {
  const { terms, terminology } = useTerminology()

  const wayfarerLabel = terminology === 'CAIRN' ? 'Wayfarer' : 'Profile'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Wayfarer / Profile */}
      <Link to="/manifest" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{wayfarerLabel}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            {wayfarer.image ? (
              <img src={wayfarer.image} alt="" className="h-10 w-10 rounded-full shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted-foreground/20 shrink-0 flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{wayfarer.name ?? 'No name set'}</p>
              {wayfarer.origins?.headline && (
                <p className="text-xs text-muted-foreground truncate">{wayfarer.origins.headline}</p>
              )}
            </div>
          </div>
          <div className="border-t mb-3" />

          {(wayfarer.email || wayfarer.origins?.location || wayfarer.origins?.website || wayfarer.origins?.linkedin || wayfarer.origins?.github) && (
            <div className="flex flex-col gap-1.5">
              {wayfarer.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.email}</span>
                </div>
              )}
              {wayfarer.origins?.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.location}</span>
                </div>
              )}
              {wayfarer.origins?.website && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.website}</span>
                </div>
              )}
              {wayfarer.origins?.linkedin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.linkedin}</span>
                </div>
              )}
              {wayfarer.origins?.github && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.github}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Manifest */}
      <Link to="/manifest" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.manifest}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {(manifestHighlights.totalYearsExperience > 0 || manifestHighlights.mostRecentExpedition || manifestHighlights.mostRecentTraining || manifestHighlights.topGear.length > 0) && (
            <>
              <div className="flex flex-col gap-2 mb-3">
                {manifestHighlights.totalYearsExperience > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium">{manifestHighlights.totalYearsExperience} yrs</span>
                  </div>
                )}
                {manifestHighlights.mostRecentExpedition && (
                  <div className="flex items-center justify-between text-xs gap-3">
                    <span className="text-muted-foreground shrink-0">Current Role</span>
                    <span className="font-medium text-right truncate">
                      {manifestHighlights.mostRecentExpedition.title} · {manifestHighlights.mostRecentExpedition.company}
                    </span>
                  </div>
                )}
                {manifestHighlights.mostRecentTraining && (
                  <div className="flex items-center justify-between text-xs gap-3">
                    <span className="text-muted-foreground shrink-0">Training</span>
                    <span className="font-medium text-right truncate">
                      {manifestHighlights.mostRecentTraining.degree
                        ? `${manifestHighlights.mostRecentTraining.degree} · ${manifestHighlights.mostRecentTraining.institution}`
                        : manifestHighlights.mostRecentTraining.institution}
                    </span>
                  </div>
                )}
                {manifestHighlights.topGear.length > 0 && (
                  <div className="flex items-start justify-between text-xs gap-3">
                    <span className="text-muted-foreground shrink-0">Top Gear</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {manifestHighlights.topGear.map(item => (
                        <span key={item.name} className="rounded-full border px-2 py-0.5 text-[10px]">{item.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t mb-3" />
            </>
          )}

          {(() => {
            const counts = Object.values(manifestCounts)
            const filled = counts.filter(n => n > 0).length
            const total = counts.length
            return (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{filled} / {total} sections</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(filled / total) * 100}%` }} />
                </div>
              </>
            )
          })()}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {([
              [terms.expeditions, manifestCounts.expeditions],
              [terms.training, manifestCounts.training],
              [terms.gear, manifestCounts.gear],
              [terms.landmarks, manifestCounts.landmarks],
              [terms.summits, manifestCounts.summits],
              [terms.pathfinding, manifestCounts.pathfinding],
              [terms.companions, manifestCounts.companions],
            ] as [string, number][]).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      {/* Provisions */}
      <Link to="/provisions" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.provisions}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{terms.supplylines}</span>
              <span className="font-medium tabular-nums">
                {fmt(provisionsSummary.monthlyTotal)}
                <span className="text-muted-foreground font-normal"> / mo · {provisionsSummary.activeCount} active</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{terms.burn}</span>
              <span className="font-medium tabular-nums">{fmt(provisionsSummary.monthlyBurn)}</span>
            </div>
          </div>

          {provisionsSummary.cacheTotalLimit > 0 && (() => {
            const pct = Math.min((provisionsSummary.cacheTotalSpent / provisionsSummary.cacheTotalLimit) * 100, 100)
            const color = pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'
            return (
              <>
                <div className="border-t mb-3" />
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{terms.cache}</span>
                  <span className="tabular-nums font-medium">
                    {fmt(provisionsSummary.cacheTotalSpent)}
                    <span className="text-muted-foreground font-normal"> / {fmt(provisionsSummary.cacheTotalLimit)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(pct)}% used</span>
                  <span>{fmt(Math.max(provisionsSummary.cacheTotalLimit - provisionsSummary.cacheTotalSpent, 0))} left</span>
                </div>
              </>
            )
          })()}

          {provisionsSummary.upcomingRenewals > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {provisionsSummary.upcomingRenewals} renewal{provisionsSummary.upcomingRenewals !== 1 ? 's' : ''} in next 7 days
            </p>
          )}
        </div>
      </Link>

      {/* Itinerary */}
      <ItinerarySnapshotPanel stops={itinerarySummary.stops} />

      {/* Signals */}
      <SignalsSnapshotPanel
        unreadCount={signalsSummary.unreadCount}
        latestMessages={signalsSummary.latestMessages}
      />
    </div>
  )
}
