import { ContextTabButton } from '@/components/studio/ui/context-tab'

export type ManifestCanvasView = 'manifest' | 'journey'

export function ManifestPageTabs({
  canvasView,
  manifestLabel,
  journeyLabel,
  onCanvasViewChange,
}: {
  canvasView: ManifestCanvasView
  manifestLabel: string
  journeyLabel: string
  onCanvasViewChange: (view: ManifestCanvasView) => void
}) {
  const tabs: Array<{ id: ManifestCanvasView; label: string }> = [
    { id: 'manifest', label: manifestLabel },
    { id: 'journey', label: journeyLabel },
  ]

  return (
    <nav
      className="flex h-full min-w-0 items-stretch justify-center gap-0.5 px-1 lg:px-0"
      aria-label="Manifest views"
    >
      {tabs.map((tab) => {
        const active = tab.id === canvasView
        return (
          <ContextTabButton
            key={tab.id}
            type="button"
            active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onCanvasViewChange(tab.id)}
          >
            {tab.label}
          </ContextTabButton>
        )
      })}
    </nav>
  )
}
