import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import type { Terms } from '@/lib/terminology'
import type { ManifestData, ManifestOrigins } from '@/lib/api/manifest'
import {
  formatCompanionAge,
  formatManifestDate,
  type ManifestJourneySectionId,
} from './manifest-format'
import { cn } from '@/lib/utils'
import { patchManifestCompanion } from './manifest-patch'
import { ManifestInlineRichText } from './manifest-inline-rich-text'

function JourneySection({
  id,
  title,
  registerSection,
  onSectionSelect,
  onAdd,
  children,
}: {
  id: ManifestJourneySectionId
  title: string
  registerSection: (id: ManifestJourneySectionId, node: HTMLElement | null) => void
  onSectionSelect: (id: ManifestJourneySectionId) => void
  onAdd?: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    registerSection(id, ref.current)
    return () => registerSection(id, null)
  }, [id, registerSection])

  return (
    <section ref={ref} id={`manifest-journey-${id}`} className="flex scroll-mt-4 flex-col gap-4">
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

function SelectableCompanion({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-inspectable
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/30',
        selected ? 'border-primary bg-primary/5' : 'border-border',
      )}
    >
      {children}
    </button>
  )
}

export function ManifestJourneyCanvas({
  data,
  terms,
  selectedEntryId,
  registerSection,
  onOriginsChange,
  onSelectCompanion,
  onSectionSelect,
  onAddEntry,
  setDraft,
}: {
  data: ManifestData
  terms: Terms
  selectedEntryId: string | null
  registerSection: (id: ManifestJourneySectionId, node: HTMLElement | null) => void
  onOriginsChange: (origins: ManifestOrigins) => void
  onSelectCompanion: (companionId: string) => void
  onSectionSelect: (sectionId: ManifestJourneySectionId) => void
  onAddEntry: (sectionId: ManifestJourneySectionId) => void
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

  const activeCompanions = data.companions.filter((companion) => !companion.passed)
  const passedCompanions = data.companions.filter((companion) => companion.passed)

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {data.user.image ? <AvatarImage src={data.user.image} alt={displayName} /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {origins.headline ? <p className="text-muted-foreground">{origins.headline}</p> : null}
          </div>
        </div>

        <JourneySection
          id="bio"
          title={terms.bio}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
        >
          <ManifestInlineRichText
            value={origins.bio ?? ''}
            onChange={(html) => onOriginsChange({ ...origins, bio: html || null })}
            placeholder={`Write your ${terms.bio.toLowerCase()}…`}
            minHeightClassName="min-h-[200px]"
          />
        </JourneySection>

        <JourneySection
          id="companions"
          title={terms.companions}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('companions')}
        >
          {activeCompanions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.companions.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeCompanions.map((companion) => (
                <div key={companion.id}>
                  <SelectableCompanion
                    selected={selectedEntryId === companion.id}
                    onSelect={() => onSelectCompanion(companion.id)}
                  >
                    <h3 className="font-medium">{companion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companion.species}
                      {companion.breed ? ` · ${companion.breed}` : ''}
                      {companion.birthday
                        ? ` · ${formatManifestDate(companion.birthday)} · ${formatCompanionAge(companion.birthday) ?? ''}`
                        : ''}
                    </p>
                  </SelectableCompanion>
                  <ManifestInlineRichText
                    value={companion.bio ?? ''}
                    onChange={(html) =>
                      patchManifestCompanion(setDraft, companion.id, { bio: html || null })
                    }
                    placeholder={`${terms.companions} ${terms.bio.toLowerCase()}…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </JourneySection>

        <JourneySection
          id="in-memoriam"
          title={terms.summit_reached}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('in-memoriam')}
        >
          {passedCompanions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {passedCompanions.map((companion) => (
                <div key={companion.id}>
                  <SelectableCompanion
                    selected={selectedEntryId === companion.id}
                    onSelect={() => onSelectCompanion(companion.id)}
                  >
                    <h3 className="font-medium">{companion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companion.species}
                      {companion.breed ? ` · ${companion.breed}` : ''}
                    </p>
                  </SelectableCompanion>
                  <ManifestInlineRichText
                    value={companion.bio ?? ''}
                    onChange={(html) =>
                      patchManifestCompanion(setDraft, companion.id, { bio: html || null })
                    }
                    placeholder={`${terms.companions} ${terms.bio.toLowerCase()}…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No {terms.summit_reached.toLowerCase()} entries.
            </p>
          )}
        </JourneySection>
      </div>
    </div>
  )
}
