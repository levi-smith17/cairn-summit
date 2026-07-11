import { Input } from '@/components/ui/input'
import { InspectorChrome, InspectorChromeTitle } from '@/components/studio/ui/inspector-chrome'
import { useTerminology } from '@/contexts/terminology-context'
import type { ManifestOrigins } from '@/lib/api/manifest'

export function ManifestOriginsInspector({
  origins,
  onChange,
}: {
  origins: ManifestOrigins
  onChange: (origins: ManifestOrigins) => void
}) {
  const { terms } = useTerminology()

  function patch(next: Partial<ManifestOrigins>) {
    onChange({ ...origins, ...next })
  }

  return (
    <div className="flex h-full flex-col">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={terms.origins} title="Contact & links" />
      </InspectorChrome>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-xs text-muted-foreground">
          {terms.summary} and {terms.bio.toLowerCase()} edits live on the canvas. These fields update
          the header area.
        </p>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{terms.location}</span>
          <Input
            value={origins.location ?? ''}
            onChange={(event) => patch({ location: event.target.value || null })}
            placeholder="City, region"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Website</span>
          <Input
            value={origins.website ?? ''}
            onChange={(event) => patch({ website: event.target.value || null })}
            placeholder="https://…"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">LinkedIn</span>
          <Input
            value={origins.linkedin ?? ''}
            onChange={(event) => patch({ linkedin: event.target.value || null })}
            placeholder="https://linkedin.com/in/…"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">GitHub</span>
          <Input
            value={origins.github ?? ''}
            onChange={(event) => patch({ github: event.target.value || null })}
            placeholder="https://github.com/…"
          />
        </label>
      </div>
    </div>
  )
}
