'use client'

import Link from 'next/link'
import { User, BookOpen, CreditCard, Mail, ChevronRight, MapPin, Globe, Linkedin, Github } from 'lucide-react'
import { format } from 'date-fns'
import { useTerminology } from '@/contexts/terminology-context'

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
    activeCount: number
    upcomingRenewals: number
  }
  signalsSummary: {
    unreadCount: number
    latestMessages: { id: string; senderName: string; body: string; createdAt: Date | string }[]
  }
}

export function SnapshotPanels({
  wayfarer,
  manifestCounts,
  manifestHighlights,
  provisionsSummary,
  signalsSummary,
}: SnapshotPanelsProps) {
  const { terms, terminology } = useTerminology()

  const wayfarerLabel = terminology === 'CAIRN' ? 'Wayfarer' : 'Profile'

  return (
    <div className="flex flex-col gap-3">
      {/* Wayfarer / Profile */}
      <Link href="/manifest" className="block group">
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
          
          {/* Contact block */}
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
                  <Linkedin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.linkedin}</span>
                </div>
              )}
              {wayfarer.origins?.github && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Github className="h-3 w-3 shrink-0" />
                  <span className="truncate">{wayfarer.origins.github}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Manifest / Resume */}
      <Link href="/manifest" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.manifest}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Highlights */}
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

          {/* Progress bar */}
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
          {/* Section count grid */}
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

      {/* Provisions / Finance */}
      <Link href="/provisions" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.provisions}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">${provisionsSummary.monthlyTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">/ month</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{provisionsSummary.activeCount}</p>
              <p className="text-xs text-muted-foreground">active</p>
            </div>
          </div>
          {provisionsSummary.upcomingRenewals > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {provisionsSummary.upcomingRenewals} renewal{provisionsSummary.upcomingRenewals !== 1 ? 's' : ''} in next 7 days
            </p>
          )}
        </div>
      </Link>

      {/* Signals / Messages */}
      <Link href="/signals" className="block group">
        <div className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{terms.signals}</span>
            {signalsSummary.unreadCount > 0 && (
              <span className="ml-0.5 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                {signalsSummary.unreadCount}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {signalsSummary.latestMessages.length === 0 ? (
            <p className="text-xs text-muted-foreground">No {terms.signals.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {signalsSummary.latestMessages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {format(new Date(msg.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
