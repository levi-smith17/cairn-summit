'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateWaypointSettings } from '@/actions/settings'

interface WaypointSettingsValues {
  defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
  openInNewTab: boolean
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
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [values, setValues] = useState<WaypointSettingsValues>(defaultValues)

  function set<K extends keyof WaypointSettingsValues>(key: K, value: WaypointSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(defaultValues)

  function handleSave() {
    startSave(async () => {
      await updateWaypointSettings(values)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display</p>

        <SettingRow
          label="Default sort order"
          description="How waypoints are ordered when no sort is applied"
          control={
            <Select value={values.defaultSort} onValueChange={v => set('defaultSort', v as WaypointSettingsValues['defaultSort'])}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest first</SelectItem>
                <SelectItem value="OLDEST">Oldest first</SelectItem>
                <SelectItem value="TITLE_ASC">Title A–Z</SelectItem>
                <SelectItem value="TITLE_DESC">Title Z–A</SelectItem>
              </SelectContent>
            </Select>
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

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
