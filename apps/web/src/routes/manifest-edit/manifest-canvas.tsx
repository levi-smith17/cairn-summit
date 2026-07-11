import { useEffect, useRef } from 'react'
import { Plus, Globe, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import type { Terms } from '@/lib/terminology'
import type { ManifestData, ManifestOrigins } from '@/lib/api/manifest'
import { formatManifestDateRange, formatManifestMonth, type ManifestSectionId } from './manifest-format'
import { cn } from '@/lib/utils'
import {
  patchManifestExpedition,
  patchManifestLandmark,
  patchManifestPathfinding,
} from './manifest-patch'
import { ManifestGearChart } from './manifest-gear-chart'
import { ManifestInlineRichText } from './manifest-inline-rich-text'
import { isDraftEntryId } from './manifest-empty-entries'

function ManifestSection({
  id,
  title,
  registerSection,
  onSectionSelect,
  onAdd,
  children,
}: {
  id: ManifestSectionId
  title: string
  registerSection: (id: ManifestSectionId, node: HTMLElement | null) => void
  onSectionSelect: (id: ManifestSectionId) => void
  onAdd?: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    registerSection(id, ref.current)
    return () => registerSection(id, null)
  }, [id, registerSection])

  return (
    <section ref={ref} id={`manifest-section-${id}`} className="flex scroll-mt-4 flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          data-inspectable
          onClick={() => onSectionSelect(id)}
          className="shrink-0 text-lg font-semibold transition-colors hover:text-primary"
        >
          {title}
        </button>
        <div className="h-px flex-1 bg-border" />
        {onAdd ? (
          <ToolbarTooltip label={`Add ${title}`}>
            <button
              type="button"
              data-inspectable
              onClick={onAdd}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Add ${title}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function SelectableEntry({
  selected,
  onSelect,
  children,
  className,
  isDraft,
}: {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  className?: string
  isDraft?: boolean
}) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border p-3 transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-border',
        isDraft && 'border-dashed border-primary/40',
        className,
      )}
    >
      <button type="button" data-inspectable onClick={onSelect} className="w-full text-left">
        {children}
      </button>
    </div>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  )
}

function ContactLinks({ origins }: { origins: ManifestOrigins | null }) {
  if (!origins) return null
  if (!origins.location && !origins.website && !origins.linkedin && !origins.github) return null

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {origins.location ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {origins.location}
        </span>
      ) : null}
      {origins.website ? (
        <a
          href={origins.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          <Globe className="h-3.5 w-3.5" />
          Website
        </a>
      ) : null}
      {origins.linkedin ? (
        <a
          href={origins.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          LinkedIn
        </a>
      ) : null}
      {origins.github ? (
        <a
          href={origins.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          GitHub
        </a>
      ) : null}
    </div>
  )
}

export function ManifestCanvas({
  data,
  terms,
  selectedEntryId,
  registerSection,
  onOriginsChange,
  onSelectEntry,
  onSectionSelect,
  onAddEntry,
  onOpenJourney,
  setDraft,
}: {
  data: ManifestData
  terms: Terms
  selectedEntryId: string | null
  registerSection: (id: ManifestSectionId, node: HTMLElement | null) => void
  onOriginsChange: (origins: ManifestOrigins) => void
  onSelectEntry: (sectionId: ManifestSectionId, entryId: string) => void
  onSectionSelect: (sectionId: ManifestSectionId) => void
  onAddEntry: (sectionId: ManifestSectionId) => void
  onOpenJourney: () => void
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>
}) {
  const origins = data.origins ?? {
    headline: null,
    summary: null,
    bio: null,
    location: null,
    website: null,
    linkedin: null,
    github: null,
  }

  const displayName = data.user.name ?? data.user.email ?? 'Your name'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const groupedGear = data.gear.reduce<Record<string, typeof data.gear>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  function patchOrigins(patch: Partial<ManifestOrigins>) {
    onOriginsChange({ ...origins, ...patch })
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-8">
        <ManifestSection
          id="origins"
          title={terms.origins}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {data.user.image ? <AvatarImage src={data.user.image} alt={displayName} /> : null}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold">{displayName}</h1>
                <input
                  type="text"
                  value={origins.headline ?? ''}
                  onChange={(event) => patchOrigins({ headline: event.target.value || null })}
                  placeholder={terms.headline}
                  className="mt-1 w-full bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <ContactLinks origins={origins} />
            <ManifestInlineRichText
              value={origins.summary ?? ''}
              onChange={(html) => patchOrigins({ summary: html || null })}
              placeholder={`Write a ${terms.summary.toLowerCase()}…`}
              minHeightClassName="min-h-[120px]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onOpenJourney}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                {terms.bio_button}
              </button>
            </div>
          </div>
        </ManifestSection>

        <ManifestSection
          id="expeditions"
          title={terms.expeditions}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('expeditions')}
        >
          {data.expeditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.expeditions.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.expeditions.map((exp) => {
                const isDraft = isDraftEntryId(exp.id)
                return (
                  <div key={exp.id}>
                    <SelectableEntry
                      selected={selectedEntryId === exp.id}
                      onSelect={() => onSelectEntry('expeditions', exp.id)}
                      isDraft={isDraft}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={cn('font-medium', isDraft && !exp.title && 'italic text-muted-foreground')}>
                              {exp.title || (isDraft ? `New ${terms.expeditions}` : 'Untitled')}
                            </p>
                            <p className={cn('text-sm text-muted-foreground', isDraft && !exp.company && 'italic opacity-70')}>
                              {exp.company || (isDraft ? 'Company' : '')}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {formatManifestDateRange(exp.startDate, exp.endDate, exp.current)}
                          </span>
                        </div>
                      </div>
                    </SelectableEntry>
                    <ManifestInlineRichText
                      value={exp.description ?? ''}
                      onChange={(html) =>
                        patchManifestExpedition(setDraft, exp.id, { description: html || null })
                      }
                      placeholder={`Describe this ${terms.expeditions.toLowerCase()} entry…`}
                      className="mt-2 px-1"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="training"
          title={terms.training}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('training')}
        >
          {data.training.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.training.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.training.map((entry) => {
                const isDraft = isDraftEntryId(entry.id)
                return (
                  <div key={entry.id}>
                    <SelectableEntry
                      selected={selectedEntryId === entry.id}
                      onSelect={() => onSelectEntry('training', entry.id)}
                      isDraft={isDraft}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={cn('font-medium', isDraft && !entry.institution && 'italic text-muted-foreground')}>
                              {entry.institution || (isDraft ? `New ${terms.training}` : 'Untitled')}
                            </p>
                            {entry.degree ? (
                              <p className="text-sm text-muted-foreground">{entry.degree}</p>
                            ) : isDraft ? (
                              <p className="text-sm italic text-muted-foreground/70">Degree or program</p>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {formatManifestDateRange(entry.startDate, entry.endDate, entry.current)}
                          </span>
                        </div>
                        {entry.description ? (
                          <RichTextContent
                            html={entry.description}
                            className="mt-2 text-sm text-muted-foreground"
                          />
                        ) : isDraft ? (
                          <p className="mt-2 text-sm italic text-muted-foreground/50">Add notes in the inspector…</p>
                        ) : null}
                      </div>
                    </SelectableEntry>
                  </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="gear"
          title={terms.gear}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('gear')}
        >
          {data.gear.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.gear.toLowerCase()} yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Object.entries(groupedGear).map(([category, items]) => {
                const hasLevels = items.some((item) => item.level)
                if (hasLevels) {
                  return (
                    <ManifestGearChart
                      key={category}
                      category={category}
                      items={items}
                      selectedEntryId={selectedEntryId}
                      onSelectItem={(id) => onSelectEntry('gear', id)}
                    />
                  )
                }
                return (
                  <div key={category} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{category}</p>
                    <ul className="m-0 list-none space-y-1 p-0 text-sm text-muted-foreground">
                      {items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            data-inspectable
                            onClick={() => onSelectEntry('gear', item.id)}
                            className={cn(
                              'text-left hover:text-foreground',
                              selectedEntryId === item.id && 'font-medium text-foreground',
                            )}
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="landmarks"
          title={terms.landmarks}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('landmarks')}
        >
          {data.landmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.landmarks.toLowerCase()} yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.landmarks.map((landmark) => (
                <div key={landmark.id}>
                  <SelectableEntry
                    selected={selectedEntryId === landmark.id}
                    onSelect={() => onSelectEntry('landmarks', landmark.id)}
                    className="bg-secondary p-4"
                  >
                    <p className="font-medium">{landmark.name}</p>
                  </SelectableEntry>
                  <ManifestInlineRichText
                    value={landmark.description ?? ''}
                    onChange={(html) =>
                      patchManifestLandmark(setDraft, landmark.id, { description: html || null })
                    }
                    placeholder={`Describe this ${terms.landmarks.toLowerCase()} entry…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="summits"
          title={terms.summits}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('summits')}
        >
          {data.summits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.summits.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.summits.map((summit) => {
                const isDraft = isDraftEntryId(summit.id)
                return (
                  <div key={summit.id}>
                    <SelectableEntry
                      selected={selectedEntryId === summit.id}
                      onSelect={() => onSelectEntry('summits', summit.id)}
                      isDraft={isDraft}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={cn('font-medium', isDraft && !summit.title && 'italic text-muted-foreground')}>
                              {summit.title || (isDraft ? `New ${terms.summits}` : 'Untitled')}
                            </p>
                            {summit.issuer ? (
                              <p className="text-sm text-muted-foreground">{summit.issuer}</p>
                            ) : isDraft ? (
                              <p className="text-sm italic text-muted-foreground/70">Issuer</p>
                            ) : null}
                          </div>
                          {summit.date ? (
                            <span className="shrink-0 text-sm text-muted-foreground">
                              {formatManifestMonth(summit.date)}
                            </span>
                          ) : null}
                        </div>
                        {summit.description ? (
                          <RichTextContent
                            html={summit.description}
                            className="mt-2 text-sm text-muted-foreground"
                          />
                        ) : isDraft ? (
                          <p className="mt-2 text-sm italic text-muted-foreground/50">Add notes in the inspector…</p>
                        ) : null}
                      </div>
                    </SelectableEntry>
                  </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="pathfinding"
          title={terms.pathfinding}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('pathfinding')}
        >
          {data.pathfinding.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.pathfinding.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.pathfinding.map((entry) => (
                <div key={entry.id}>
                  <SelectableEntry
                    selected={selectedEntryId === entry.id}
                    onSelect={() => onSelectEntry('pathfinding', entry.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{entry.organization}</p>
                          {entry.role ? (
                            <p className="text-sm text-muted-foreground">{entry.role}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatManifestDateRange(entry.startDate, entry.endDate, entry.current)}
                        </span>
                      </div>
                    </div>
                  </SelectableEntry>
                  <ManifestInlineRichText
                    value={entry.description ?? ''}
                    onChange={(html) =>
                      patchManifestPathfinding(setDraft, entry.id, { description: html || null })
                    }
                    placeholder={`Describe this ${terms.pathfinding.toLowerCase()} entry…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </ManifestSection>
      </div>
    </div>
  )
}
