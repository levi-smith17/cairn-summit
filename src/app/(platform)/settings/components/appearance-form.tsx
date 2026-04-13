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
import { updateAppearanceSettings, updateTimeFormat } from '@/actions/settings'

interface AppearanceValues {
  sidebarDefault: 'EXPANDED' | 'COLLAPSED'
  defaultLandingPage: string
  dateFormat: 'MDY' | 'DMY' | 'YMD'
  timeFormat: 'TWELVE' | 'TWENTYFOUR'
}

interface AppearanceFormProps {
  defaultValues: AppearanceValues
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

const LANDING_PAGES = [
  { value: '/basecamp',   label: 'Basecamp' },
  { value: '/itinerary',  label: 'Itinerary' },
  { value: '/signals',    label: 'Signals' },
  { value: '/waypoints',  label: 'Waypoints' },
  { value: '/logs',       label: 'Logs' },
  { value: '/provisions', label: 'Provisions' },
]

export function AppearanceForm({ defaultValues }: AppearanceFormProps) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [values, setValues] = useState<AppearanceValues>(defaultValues)

  function set<K extends keyof AppearanceValues>(key: K, value: AppearanceValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(defaultValues)

  function handleSave() {
    startSave(async () => {
      const { timeFormat, ...appearanceValues } = values
      await Promise.all([
        updateAppearanceSettings(appearanceValues),
        updateTimeFormat(timeFormat),
      ])
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout</p>

        <SettingRow
          label="Sidebar default state"
          description="Whether the sidebar starts expanded or collapsed on page load"
          control={
            <Select value={values.sidebarDefault} onValueChange={v => set('sidebarDefault', v as AppearanceValues['sidebarDefault'])}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPANDED">Expanded</SelectItem>
                <SelectItem value="COLLAPSED">Collapsed</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          label="Default landing page"
          description="Which page opens when you log in"
          control={
            <Select value={values.defaultLandingPage} onValueChange={v => set('defaultLandingPage', v)}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANDING_PAGES.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Formatting</p>

        <SettingRow
          label="Date format"
          description="How dates are displayed across the platform"
          control={
            <Select value={values.dateFormat} onValueChange={v => set('dateFormat', v as AppearanceValues['dateFormat'])}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MDY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DMY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YMD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          label="Time format"
          description="How times are displayed across the Itinerary and other areas"
          control={
            <Select value={values.timeFormat} onValueChange={v => set('timeFormat', v as AppearanceValues['timeFormat'])}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TWELVE">12-hour (2:30 PM)</SelectItem>
                <SelectItem value="TWENTYFOUR">24-hour (14:30)</SelectItem>
              </SelectContent>
            </Select>
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
