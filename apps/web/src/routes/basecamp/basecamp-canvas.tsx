import { Link } from 'react-router-dom'
import {
  Award,
  Backpack,
  Briefcase,
  ChevronRight,
  Compass,
  Flag,
  GraduationCap,
  NotebookPen,
  PawPrint,
} from 'lucide-react'
import { useTerminology } from '@/contexts/terminology-context'
import { SnapshotPanels, type SnapshotData } from './snapshot-panels'
import { cardHoverBorder, cn } from '@/lib/utils'

export type LogbookCard = {
  id: string
  name: string
  excerpt: string
  updatedAt: string
}

export type ManifestSectionCard = {
  id: string
  termKey:
    | 'expeditions'
    | 'training'
    | 'gear'
    | 'landmarks'
    | 'summits'
    | 'pathfinding'
    | 'companions'
  count: number
  summary: string | null
}

const MANIFEST_ICONS = {
  expeditions: Briefcase,
  training: GraduationCap,
  gear: Backpack,
  landmarks: Flag,
  summits: Award,
  pathfinding: Compass,
  companions: PawPrint,
} as const

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function buildLogbookCards(
  logs: Array<{
    id: string
    title?: string | null
    content?: string
    trailId?: string | null
    createdAt?: string
    updatedAt?: string
  }>,
  trails: Array<{ id: string; name: string }>,
  limit = 8,
): LogbookCard[] {
  const byTrail = new Map<
    string,
    { id: string; name: string; updatedAt: string; excerpt: string }
  >()

  for (const log of logs) {
    const key = log.trailId ?? '__unfiled__'
    const stamp = String(log.updatedAt ?? log.createdAt ?? '')
    const existing = byTrail.get(key)
    if (!existing || stamp > existing.updatedAt) {
      const trail = log.trailId ? trails.find((t) => t.id === log.trailId) : null
      const plain = stripHtml(log.content ?? '')
      const excerpt =
        (log.title ? `${log.title} — ` : '') +
        (plain.length > 120 ? `${plain.slice(0, 120)}…` : plain)
      byTrail.set(key, {
        id: key,
        name: trail?.name ?? (log.trailId ? 'Unknown' : 'Unfiled'),
        updatedAt: stamp,
        excerpt: excerpt || 'No content yet',
      })
    }
  }

  return [...byTrail.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
}

export function buildManifestSectionCards(
  counts: {
    expeditions: number
    training: number
    gear: number
    landmarks: number
    summits: number
    pathfinding: number
    companions: number
  },
  highlights: {
    totalYearsExperience: number
    mostRecentExpedition: { title: string; company: string } | null
    mostRecentTraining: { institution: string; degree: string | null } | null
    topGear: { name: string }[]
    mostRecentLandmark?: { name: string } | null
    mostRecentSummit?: { name: string } | null
    mostRecentPathfinding?: { organization: string | null; role: string | null } | null
    mostRecentCompanion?: { name: string } | null
  },
): ManifestSectionCard[] {
  return [
    {
      id: 'expeditions',
      termKey: 'expeditions',
      count: counts.expeditions,
      summary: highlights.mostRecentExpedition
        ? `${highlights.mostRecentExpedition.title} · ${highlights.mostRecentExpedition.company}`
        : highlights.totalYearsExperience > 0
          ? `${highlights.totalYearsExperience} yrs experience`
          : null,
    },
    {
      id: 'training',
      termKey: 'training',
      count: counts.training,
      summary: highlights.mostRecentTraining
        ? highlights.mostRecentTraining.degree
          ? `${highlights.mostRecentTraining.degree} · ${highlights.mostRecentTraining.institution}`
          : highlights.mostRecentTraining.institution
        : null,
    },
    {
      id: 'gear',
      termKey: 'gear',
      count: counts.gear,
      summary:
        highlights.topGear.length > 0
          ? highlights.topGear.map((g) => g.name).join(', ')
          : null,
    },
    {
      id: 'landmarks',
      termKey: 'landmarks',
      count: counts.landmarks,
      summary: highlights.mostRecentLandmark?.name ?? null,
    },
    {
      id: 'summits',
      termKey: 'summits',
      count: counts.summits,
      summary: highlights.mostRecentSummit?.name ?? null,
    },
    {
      id: 'pathfinding',
      termKey: 'pathfinding',
      count: counts.pathfinding,
      summary: highlights.mostRecentPathfinding
        ? [highlights.mostRecentPathfinding.role, highlights.mostRecentPathfinding.organization]
            .filter(Boolean)
            .join(' · ') || null
        : null,
    },
    {
      id: 'companions',
      termKey: 'companions',
      count: counts.companions,
      summary: highlights.mostRecentCompanion?.name ?? null,
    },
  ]
}

export function BasecampCanvas({
  snapshot,
  logbooks,
  manifestSections,
}: {
  snapshot: SnapshotData
  logbooks: LogbookCard[]
  manifestSections: ManifestSectionCard[]
}) {
  const { terms } = useTerminology()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-8 px-4 py-4 sm:px-6 lg:px-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Snapshot
            </h2>
          </div>
          <SnapshotPanels {...snapshot} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {terms.logs}
            </h2>
            <Link
              to="/logs"
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {logbooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {terms.logs.toLowerCase()} yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {logbooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/logs?book=${encodeURIComponent(book.id)}`}
                  className={cn(
                    'group flex flex-col rounded-xl border bg-card p-3 hover:bg-muted/30',
                    cardHoverBorder,
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <NotebookPen className="h-3 w-3" aria-hidden />
                    <span className="truncate">{terms.logbook}</span>
                    <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">{book.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {book.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {terms.manifest}
            </h2>
            <Link
              to="/manifest"
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {manifestSections.map((section) => {
              const Icon = MANIFEST_ICONS[section.termKey]
              const label = terms[section.termKey]
              return (
                <Link
                  key={section.id}
                  to={`/manifest?section=${section.id}`}
                  className={cn(
                    'group flex flex-col rounded-xl border bg-card p-3 hover:bg-muted/30',
                    cardHoverBorder,
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" aria-hidden />
                    <span className="truncate">{label}</span>
                    <span className="ml-auto tabular-nums">{section.count}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {section.summary ?? `No ${label.toLowerCase()} yet`}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
