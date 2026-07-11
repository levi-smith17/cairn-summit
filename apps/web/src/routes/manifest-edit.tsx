import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { PlatformStudioContextBar } from '@/components/studio/platform-studio-context-bar'
import { StudioLayout } from '@/components/studio/layout/studio-layout'
import { ManifestStudioSkeleton } from '@/components/studio/ui/studio-skeletons'
import { Button } from '@/components/ui/button'
import { ToolbarTooltip } from '@/components/studio/ui/toolbar-tooltip'
import {
  getManifestData,
  saveOrigins,
  type ManifestData,
  type ManifestOrigins,
} from '@/lib/api/manifest'
import { useTerminology } from '@/contexts/terminology-context'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { ManifestCanvas } from './manifest-edit/manifest-canvas'
import { ManifestJourneyCanvas } from './manifest-edit/manifest-journey-canvas'
import { ManifestOriginsInspector } from './manifest-edit/manifest-origins-inspector'
import {
  ManifestCompanionInspector,
  ManifestExpeditionInspector,
  ManifestGearInspector,
  ManifestLandmarkInspector,
  ManifestPathfindingInspector,
  ManifestSummitInspector,
  ManifestTrainingInspector,
} from './manifest-edit/manifest-entry-inspectors'
import { ManifestRichTextProvider } from './manifest-edit/manifest-rich-text-context'
import { ManifestSectionsRail } from './manifest-edit/manifest-sections-rail'
import { ManifestPageTabs, type ManifestCanvasView } from './manifest-edit/manifest-page-tabs'
import { flushAllManifestPatchSaves } from './manifest-edit/manifest-patch'
import {
  buildJourneySections,
  buildManifestSections,
  type ManifestJourneySectionId,
  type ManifestSectionId,
} from './manifest-edit/manifest-format'
import {
  createDraftId,
  createEmptyCompanion,
  createEmptyManifestEntry,
  isDraftEntryId,
  JOURNEY_ADD_SECTIONS,
  MANIFEST_ADD_SECTIONS,
} from './manifest-edit/manifest-empty-entries'

const emptyOrigins = (): ManifestOrigins => ({
  headline: null,
  summary: null,
  bio: null,
  location: null,
  website: null,
  linkedin: null,
  github: null,
})

function serializeOrigins(origins: ManifestOrigins | null | undefined) {
  return JSON.stringify(origins ?? emptyOrigins())
}

const LIST_SECTIONS = new Set<ManifestSectionId>([
  'expeditions',
  'training',
  'gear',
  'landmarks',
  'summits',
  'pathfinding',
])

const MANIFEST_SECTIONS = new Set<ManifestSectionId>([
  'origins',
  'expeditions',
  'training',
  'gear',
  'landmarks',
  'summits',
  'pathfinding',
])

const JOURNEY_SECTIONS = new Set<ManifestJourneySectionId>(['bio', 'companions', 'in-memoriam'])

function normalizeManifestData(data: ManifestData): ManifestData {
  return {
    ...data,
    origins: data.origins ?? emptyOrigins(),
    expeditions: data.expeditions ?? [],
    training: data.training ?? [],
    gear: data.gear ?? [],
    landmarks: data.landmarks ?? [],
    summits: data.summits ?? [],
    pathfinding: data.pathfinding ?? [],
    companions: (data.companions ?? []).map((companion) => ({
      ...companion,
      media: companion.media ?? [],
    })),
  }
}

export default function Manifest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { terms } = useTerminology()
  const { pinned: inspectorPinned } = useInspectorPin()
  const [searchParams, setSearchParams] = useSearchParams()

  const [inspectorEngaged, setInspectorEngaged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canvasView, setCanvasView] = useState<ManifestCanvasView>('manifest')
  const [activeManifestSection, setActiveManifestSection] = useState<ManifestSectionId>('origins')
  const [activeJourneySection, setActiveJourneySection] = useState<ManifestJourneySectionId>('bio')
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState(false)
  const [draft, setDraft] = useState<ManifestData | null>(null)
  const deepLinkApplied = useRef(false)

  const manifestSectionRefs = useRef<Partial<Record<ManifestSectionId, HTMLElement | null>>>({})
  const journeySectionRefs = useRef<Partial<Record<ManifestJourneySectionId, HTMLElement | null>>>({})
  const originsSaveTimer = useRef<number | null>(null)
  const savedOriginsJson = useRef('')

  const { data, isLoading } = useQuery({
    queryKey: ['manifest'],
    queryFn: getManifestData,
    enabled: !!user,
    staleTime: 0,
  })

  useEffect(() => {
    if (!data) return
    const normalized = normalizeManifestData(data)
    savedOriginsJson.current = serializeOrigins(normalized.origins)
    setDraft(normalized)
  }, [data])

  const username = draft?.username ?? null
  const liveUrl = username ? `/manifest/${username}` : null
  const liveJourneyUrl = username ? `/manifest/${username}/journey` : null

  const manifestSections = useMemo(
    () => (draft ? buildManifestSections(draft, terms) : []),
    [draft, terms],
  )
  const journeySections = useMemo(
    () => (draft ? buildJourneySections(draft, terms) : []),
    [draft, terms],
  )

  const registerManifestSection = useCallback((id: ManifestSectionId, node: HTMLElement | null) => {
    manifestSectionRefs.current[id] = node
  }, [])

  const registerJourneySection = useCallback((id: ManifestJourneySectionId, node: HTMLElement | null) => {
    journeySectionRefs.current[id] = node
  }, [])

  function removeDraftEntry(entryId: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const without = <T extends { id: string }>(items: T[]) =>
        items.filter((item) => item.id !== entryId)
      return {
        ...prev,
        expeditions: without(prev.expeditions),
        training: without(prev.training),
        gear: without(prev.gear),
        landmarks: without(prev.landmarks),
        summits: without(prev.summits),
        pathfinding: without(prev.pathfinding),
        companions: without(prev.companions),
      }
    })
  }

  function resetEntrySelection() {
    setSelectedEntryId(null)
    setCreatingEntry(false)
  }

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    if (creatingEntry && selectedEntryId && isDraftEntryId(selectedEntryId)) {
      removeDraftEntry(selectedEntryId)
    }
    setInspectorEngaged(false)
    resetEntrySelection()
  }, [creatingEntry, inspectorPinned, selectedEntryId])

  function scrollToManifestSection(sectionId: ManifestSectionId, keepSelection = false) {
    setActiveManifestSection(sectionId)
    if (!keepSelection) resetEntrySelection()
    requestAnimationFrame(() => {
      manifestSectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function scrollToJourneySection(sectionId: ManifestJourneySectionId, keepSelection = false) {
    setActiveJourneySection(sectionId)
    if (!keepSelection) resetEntrySelection()
    requestAnimationFrame(() => {
      journeySectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    if (!draft || deepLinkApplied.current) return
    const section = searchParams.get('section')
    if (!section) {
      deepLinkApplied.current = true
      return
    }

    if (MANIFEST_SECTIONS.has(section as ManifestSectionId)) {
      setCanvasView('manifest')
      setActiveManifestSection(section as ManifestSectionId)
      requestAnimationFrame(() => {
        manifestSectionRefs.current[section as ManifestSectionId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    } else if (section === 'companions' || JOURNEY_SECTIONS.has(section as ManifestJourneySectionId)) {
      const journeyId = (section === 'companions' ? 'companions' : section) as ManifestJourneySectionId
      setCanvasView('journey')
      setActiveJourneySection(journeyId)
      requestAnimationFrame(() => {
        journeySectionRefs.current[journeyId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }

    deepLinkApplied.current = true
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        next.delete('section')
        return next
      },
      { replace: true },
    )
  }, [draft, searchParams, setSearchParams])

  function handleAddManifestEntry(sectionId: ManifestSectionId) {
    if (!draft || sectionId === 'origins') return
    const { entry } = createEmptyManifestEntry(sectionId)
    setDraft((prev) => {
      if (!prev) return prev
      switch (sectionId) {
        case 'expeditions':
          return { ...prev, expeditions: [entry as (typeof prev.expeditions)[0], ...prev.expeditions] }
        case 'training':
          return { ...prev, training: [entry as (typeof prev.training)[0], ...prev.training] }
        case 'gear':
          return { ...prev, gear: [entry as (typeof prev.gear)[0], ...prev.gear] }
        case 'landmarks':
          return { ...prev, landmarks: [entry as (typeof prev.landmarks)[0], ...prev.landmarks] }
        case 'summits':
          return { ...prev, summits: [entry as (typeof prev.summits)[0], ...prev.summits] }
        case 'pathfinding':
          return { ...prev, pathfinding: [entry as (typeof prev.pathfinding)[0], ...prev.pathfinding] }
        default:
          return prev
      }
    })
    setCanvasView('manifest')
    setActiveManifestSection(sectionId)
    setSelectedEntryId((entry as { id: string }).id)
    setCreatingEntry(true)
    setInspectorEngaged(true)
    scrollToManifestSection(sectionId, true)
  }

  function handleAddJourneyEntry(sectionId: ManifestJourneySectionId) {
    if (!draft || sectionId === 'bio') return
    const passed = sectionId === 'in-memoriam'
    const entry = createEmptyCompanion(createDraftId(), passed)
    setDraft((prev) => (prev ? { ...prev, companions: [entry, ...prev.companions] } : prev))
    setCanvasView('journey')
    setActiveJourneySection(sectionId)
    setSelectedEntryId(entry.id)
    setCreatingEntry(true)
    setInspectorEngaged(true)
    scrollToJourneySection(sectionId, true)
  }

  function invalidateManifest() {
    void queryClient.invalidateQueries({ queryKey: ['manifest'] })
  }

  function scheduleOriginsSave(origins: ManifestOrigins) {
    const json = serializeOrigins(origins)
    if (json === savedOriginsJson.current) return
    if (originsSaveTimer.current) window.clearTimeout(originsSaveTimer.current)
    originsSaveTimer.current = window.setTimeout(() => {
      void saveOrigins(origins)
        .then(() => {
          savedOriginsJson.current = serializeOrigins(origins)
          invalidateManifest()
          toast.success('Saved')
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to save origins')
        })
    }, 700)
  }

  const originsDirty = useMemo(() => {
    if (!draft) return false
    return serializeOrigins(draft.origins) !== savedOriginsJson.current
  }, [draft])

  async function handleManualSave() {
    if (!draft) return
    setSaving(true)
    try {
      await flushAllManifestPatchSaves()
      if (originsSaveTimer.current) {
        window.clearTimeout(originsSaveTimer.current)
        originsSaveTimer.current = null
      }
      if (originsDirty) {
        const origins = draft.origins ?? emptyOrigins()
        await saveOrigins(origins)
        savedOriginsJson.current = serializeOrigins(origins)
      }
      invalidateManifest()
      toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save manifest')
    } finally {
      setSaving(false)
    }
  }

  const handleManualSaveRef = useRef(handleManualSave)
  handleManualSaveRef.current = handleManualSave

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        void handleManualSaveRef.current()
      }
      if (event.key === 'Escape' && !inspectorPinned) {
        dismissInspector()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector, inspectorPinned])

  function handleOriginsChange(origins: ManifestOrigins) {
    setDraft((prev) => (prev ? { ...prev, origins } : prev))
    scheduleOriginsSave(origins)
  }

  function handleManifestSectionSelect(sectionId: ManifestSectionId) {
    if (!MANIFEST_SECTIONS.has(sectionId)) return
    scrollToManifestSection(sectionId)
    if (sectionId === 'origins' || LIST_SECTIONS.has(sectionId) === false) {
      setInspectorEngaged(true)
      return
    }
    if (!selectedEntryId) setInspectorEngaged(false)
  }

  function handleJourneySectionSelect(sectionId: ManifestJourneySectionId) {
    if (!JOURNEY_SECTIONS.has(sectionId)) return
    scrollToJourneySection(sectionId)
    if (sectionId === 'bio') {
      setInspectorEngaged(true)
      return
    }
    if (!selectedEntryId) setInspectorEngaged(false)
  }

  function handleSelectManifestEntry(sectionId: ManifestSectionId, entryId: string) {
    if (selectedEntryId === entryId && inspectorEngaged && !inspectorPinned) {
      dismissInspector()
      return
    }
    setCanvasView('manifest')
    setActiveManifestSection(sectionId)
    setSelectedEntryId(entryId)
    setCreatingEntry(isDraftEntryId(entryId))
    setInspectorEngaged(true)
  }

  function handleSelectCompanion(companionId: string) {
    if (selectedEntryId === companionId && inspectorEngaged && !inspectorPinned) {
      dismissInspector()
      return
    }
    setCanvasView('journey')
    setSelectedEntryId(companionId)
    setCreatingEntry(isDraftEntryId(companionId))
    setInspectorEngaged(true)
    const companion = draft?.companions.find((entry) => entry.id === companionId)
    setActiveJourneySection(companion?.passed ? 'in-memoriam' : 'companions')
  }

  function handleCanvasPointerDown(event: React.PointerEvent) {
    if (inspectorPinned) return
    const target = event.target as HTMLElement
    if (
      !target.closest(
        'a, button, input, select, textarea, [data-inspectable], [data-manifest-editor], .ProseMirror',
      )
    ) {
      dismissInspector()
    }
  }

  function handleCanvasViewChange(view: ManifestCanvasView) {
    if (creatingEntry && selectedEntryId && isDraftEntryId(selectedEntryId)) {
      removeDraftEntry(selectedEntryId)
    }
    setCanvasView(view)
    resetEntrySelection()
    if (view === 'journey') {
      setActiveJourneySection('bio')
    } else {
      setActiveManifestSection('origins')
    }
  }

  const manifestAddSections = useMemo(
    () => manifestSections.filter((section) => MANIFEST_ADD_SECTIONS.includes(section.id)),
    [manifestSections],
  )
  const journeyAddSections = useMemo(
    () => journeySections.filter((section) => JOURNEY_ADD_SECTIONS.includes(section.id)),
    [journeySections],
  )

  const listInspectorProps = {
    selectedId: selectedEntryId,
    creating: creatingEntry,
    onSelect: (id: string | null) => {
      if (
        selectedEntryId &&
        isDraftEntryId(selectedEntryId) &&
        id !== selectedEntryId &&
        creatingEntry
      ) {
        removeDraftEntry(selectedEntryId)
      }
      setSelectedEntryId(id)
    },
    onCreatingChange: (creating: boolean) => {
      if (!creating && selectedEntryId && isDraftEntryId(selectedEntryId)) {
        removeDraftEntry(selectedEntryId)
      }
      setCreatingEntry(creating)
      if (creating) setInspectorEngaged(true)
    },
    onSaved: invalidateManifest,
  }

  if (isLoading) return <ManifestStudioSkeleton />

  const inspectorOpen = (inspectorPinned || inspectorEngaged) && Boolean(draft)
  const inspectorState = inspectorOpen ? 'open' : draft ? 'hint' : 'hidden'

  function renderManifestInspector() {
    if (!draft) return null

    if (activeManifestSection === 'origins') {
      return (
        <ManifestOriginsInspector
          origins={draft.origins ?? emptyOrigins()}
          onChange={handleOriginsChange}
        />
      )
    }

    if (!selectedEntryId && !creatingEntry) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Select an entry on the canvas to edit, or use + to add one.
        </div>
      )
    }

    switch (activeManifestSection) {
      case 'expeditions':
        return (
          <ManifestExpeditionInspector
            items={draft.expeditions}
            onChange={(expeditions) => setDraft((prev) => (prev ? { ...prev, expeditions } : prev))}
            {...listInspectorProps}
          />
        )
      case 'training':
        return (
          <ManifestTrainingInspector
            items={draft.training}
            onChange={(training) => setDraft((prev) => (prev ? { ...prev, training } : prev))}
            {...listInspectorProps}
          />
        )
      case 'gear':
        return (
          <ManifestGearInspector
            items={draft.gear}
            onChange={(gear) => setDraft((prev) => (prev ? { ...prev, gear } : prev))}
            {...listInspectorProps}
          />
        )
      case 'landmarks':
        return (
          <ManifestLandmarkInspector
            items={draft.landmarks}
            onChange={(landmarks) => setDraft((prev) => (prev ? { ...prev, landmarks } : prev))}
            {...listInspectorProps}
          />
        )
      case 'summits':
        return (
          <ManifestSummitInspector
            items={draft.summits}
            onChange={(summits) => setDraft((prev) => (prev ? { ...prev, summits } : prev))}
            {...listInspectorProps}
          />
        )
      case 'pathfinding':
        return (
          <ManifestPathfindingInspector
            items={draft.pathfinding}
            onChange={(pathfinding) => setDraft((prev) => (prev ? { ...prev, pathfinding } : prev))}
            {...listInspectorProps}
          />
        )
      default:
        return null
    }
  }

  function renderJourneyInspector() {
    if (!draft) return null
    if (activeJourneySection === 'bio') {
      return (
        <ManifestOriginsInspector
          origins={draft.origins ?? emptyOrigins()}
          onChange={handleOriginsChange}
        />
      )
    }
    if (!selectedEntryId && !creatingEntry) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Select a companion on the canvas to edit, or use + to add one.
        </div>
      )
    }
    return (
      <ManifestCompanionInspector
        items={draft.companions}
        onChange={(companions) => setDraft((prev) => (prev ? { ...prev, companions } : prev))}
        {...listInspectorProps}
      />
    )
  }

  return (
    <StudioLayout
      railLabel="Sections"
      contextBar={
        <PlatformStudioContextBar
          aria-label={`${terms.manifest} header`}
          title={terms.manifest}
          showInspectorPin
          tabs={
            <ManifestPageTabs
              canvasView={canvasView}
              manifestLabel={terms.manifest}
              journeyLabel={terms.bio_button}
              onCanvasViewChange={handleCanvasViewChange}
            />
          }
          actions={
            <ToolbarTooltip label="Save (⌘S)">
              <Button
                type="button"
                variant="default"
                className="relative h-9 gap-1.5 px-2.5 shadow-sm sm:px-4"
                onClick={() => void handleManualSave()}
                disabled={saving || !originsDirty}
                aria-label="Save"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden sm:inline">Save</span>
                {originsDirty && !saving ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-foreground"
                    aria-hidden
                  />
                ) : null}
              </Button>
            </ToolbarTooltip>
          }
        />
      }
      rail={
        draft ? (
          canvasView === 'manifest' ? (
            <ManifestSectionsRail
              sections={manifestSections}
              activeSection={activeManifestSection}
              onSelectSection={handleManifestSectionSelect}
              addSections={manifestAddSections}
              onAddSection={handleAddManifestEntry}
              liveUrl={liveUrl}
            />
          ) : (
            <ManifestSectionsRail
              sections={journeySections}
              activeSection={activeJourneySection}
              onSelectSection={handleJourneySectionSelect}
              addSections={journeyAddSections}
              onAddSection={handleAddJourneyEntry}
              liveUrl={liveJourneyUrl}
            />
          )
        ) : undefined
      }
      canvas={
        !draft ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Unable to load manifest.
          </div>
        ) : (
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onPointerDown={handleCanvasPointerDown}
          >
            <ManifestRichTextProvider>
              {canvasView === 'manifest' ? (
                <ManifestCanvas
                  data={draft}
                  terms={terms}
                  selectedEntryId={selectedEntryId}
                  registerSection={registerManifestSection}
                  onOriginsChange={handleOriginsChange}
                  onSelectEntry={handleSelectManifestEntry}
                  onSectionSelect={handleManifestSectionSelect}
                  onAddEntry={handleAddManifestEntry}
                  onOpenJourney={() => handleCanvasViewChange('journey')}
                  setDraft={setDraft}
                />
              ) : (
                <ManifestJourneyCanvas
                  data={draft}
                  terms={terms}
                  selectedEntryId={selectedEntryId}
                  registerSection={registerJourneySection}
                  onOriginsChange={handleOriginsChange}
                  onSelectCompanion={handleSelectCompanion}
                  onSectionSelect={handleJourneySectionSelect}
                  onAddEntry={handleAddJourneyEntry}
                  setDraft={setDraft}
                />
              )}
            </ManifestRichTextProvider>
          </div>
        )
      }
      inspectorState={inspectorState}
      inspectorHint={
        canvasView === 'journey'
          ? 'Select a companion to edit, or use + to add one'
          : LIST_SECTIONS.has(activeManifestSection)
            ? 'Select an entry to edit, or use + to add one'
            : 'Select a section to edit details'
      }
      inspector={canvasView === 'manifest' ? renderManifestInspector() : renderJourneyInspector()}
    />
  )
}
