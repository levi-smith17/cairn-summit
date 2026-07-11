import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { InspectorChrome, InspectorChromeTitle } from '@/components/studio/ui/inspector-chrome'
import { useTerminology } from '@/contexts/terminology-context'
import { cn } from '@/lib/utils'

type TrailMode = 'existing' | 'new'

export function LogsNewInspector({
  trails,
  onCreate,
  onCancel,
  creating,
}: {
  trails: { id: string; name: string }[]
  onCreate: (input: { trailId?: string; newTrailName?: string }) => void
  onCancel: () => void
  creating?: boolean
}) {
  const { terms } = useTerminology()
  const singular = terms.logs.slice(0, -1) || terms.logs
  const trailSingular = terms.trails.slice(0, -1) || terms.trails
  const [mode, setMode] = useState<TrailMode>(trails.length > 0 ? 'existing' : 'new')
  const [trailId, setTrailId] = useState('')
  const [newTrailName, setNewTrailName] = useState('')

  const canCreate =
    !creating &&
    (mode === 'existing' ? Boolean(trailId) : Boolean(newTrailName.trim()))

  function handleCreate() {
    if (mode === 'existing') onCreate({ trailId })
    else onCreate({ newTrailName: newTrailName.trim() })
  }

  return (
    <div className="flex h-full flex-col">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow={`New ${singular.toLowerCase()}`}
          title={`Choose or create a ${trailSingular.toLowerCase()}`}
        />
      </InspectorChrome>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Each {trailSingular.toLowerCase()} can have one {terms.logbook.toLowerCase()}.
        </p>
        <div className="flex rounded-md border border-border p-0.5">
          <button
            type="button"
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors',
              mode === 'existing' ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
            onClick={() => setMode('existing')}
            disabled={trails.length === 0}
          >
            Existing
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors',
              mode === 'new' ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
            onClick={() => setMode('new')}
          >
            New
          </button>
        </div>

        {mode === 'existing' ? (
          trails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {terms.trails.toLowerCase()} are available without a {terms.logbook.toLowerCase()} yet.
              Create a new {trailSingular.toLowerCase()} instead.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="logs-trail-select">
                {trailSingular}
              </label>
              <CustomSelect
                value={trailId}
                onChange={setTrailId}
                options={trails.map((trail) => ({ value: trail.id, label: trail.name }))}
                placeholder={`Select ${trailSingular.toLowerCase()}…`}
              />
            </div>
          )
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="logs-new-trail-name">
              {trailSingular} name
            </label>
            <Input
              id="logs-new-trail-name"
              value={newTrailName}
              onChange={(event) => setNewTrailName(event.target.value)}
              placeholder="Research"
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!canCreate} onClick={handleCreate}>
          {creating ? 'Creating…' : `Create ${singular.toLowerCase()}`}
        </Button>
      </div>
    </div>
  )
}
