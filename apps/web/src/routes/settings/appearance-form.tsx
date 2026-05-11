import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateAppearanceSettings, updateTimeFormat } from '@/lib/api/settings'

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
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<AppearanceValues>(defaultValues)

  function set<K extends keyof AppearanceValues>(key: K, value: AppearanceValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      const { timeFormat, ...appearanceValues } = values
      await Promise.all([
        updateAppearanceSettings(appearanceValues),
        updateTimeFormat(timeFormat),
      ])
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Layout</p>

        <SettingRow
          label="Sidebar default state"
          description="Whether the sidebar starts expanded or collapsed on page load"
          control={
            <CustomSelect
              options={[{ value: 'EXPANDED', label: 'Expanded' }, { value: 'COLLAPSED', label: 'Collapsed' }]}
              value={values.sidebarDefault}
              onChange={v => set('sidebarDefault', v as AppearanceValues['sidebarDefault'])}
              triggerClassName="w-32"
            />
          }
        />

        <SettingRow
          label="Default landing page"
          description="Which page opens when you log in"
          control={
            <CustomSelect
              options={LANDING_PAGES}
              value={values.defaultLandingPage}
              onChange={v => set('defaultLandingPage', v)}
              triggerClassName="w-36"
            />
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
            <CustomSelect
              options={[{ value: 'MDY', label: 'MM/DD/YYYY' }, { value: 'DMY', label: 'DD/MM/YYYY' }, { value: 'YMD', label: 'YYYY-MM-DD' }]}
              value={values.dateFormat}
              onChange={v => set('dateFormat', v as AppearanceValues['dateFormat'])}
              triggerClassName="w-40"
            />
          }
        />

        <SettingRow
          label="Time format"
          description="How times are displayed across the Itinerary and other areas"
          control={
            <CustomSelect
              options={[{ value: 'TWELVE', label: '12-hour (2:30 PM)' }, { value: 'TWENTYFOUR', label: '24-hour (14:30)' }]}
              value={values.timeFormat}
              onChange={v => set('timeFormat', v as AppearanceValues['timeFormat'])}
              triggerClassName="w-40"
            />
          }
        />
      </div>

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
