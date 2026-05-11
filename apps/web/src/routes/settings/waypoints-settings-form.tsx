import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateWaypointSettings } from '@/lib/api/settings'

interface WaypointSettingsValues {
  defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
  openInNewTab: boolean
  waypointsPerPage: number
}

interface WaypointsSettingsFormProps {
  defaultValues: WaypointSettingsValues
}

function SettingRow({ label, description, control }: { label: string; description: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export function WaypointsSettingsForm({ defaultValues }: WaypointsSettingsFormProps) {
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<WaypointSettingsValues>(defaultValues)

  function set<K extends keyof WaypointSettingsValues>(key: K, value: WaypointSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateWaypointSettings(values)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display</p>

        <SettingRow
          label="Waypoints per page"
          description="How many waypoints to show in the list at once"
          control={
            <CustomSelect
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              value={String(values.waypointsPerPage)}
              onChange={v => set('waypointsPerPage', Number(v))}
              triggerClassName="w-20"
            />
          }
        />

        <SettingRow
          label="Default sort order"
          description="How waypoints are ordered when no sort is applied"
          control={
            <CustomSelect
              options={[
                { value: 'NEWEST', label: 'Newest first' },
                { value: 'OLDEST', label: 'Oldest first' },
                { value: 'TITLE_ASC', label: 'Title A–Z' },
                { value: 'TITLE_DESC', label: 'Title Z–A' },
              ]}
              value={values.defaultSort}
              onChange={v => set('defaultSort', v as WaypointSettingsValues['defaultSort'])}
              triggerClassName="w-36"
            />
          }
        />
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</p>

        <SettingRow
          label="Open links in new tab"
          description="Open waypoint URLs in a new browser tab instead of the current one"
          control={
            <Switch
              checked={values.openInNewTab}
              onCheckedChange={v => set('openInNewTab', v)}
            />
          }
        />
      </div>

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
