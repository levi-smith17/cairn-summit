'use client'

import { useState } from 'react'
import { CustomSelect } from '@/components/ui/custom-select'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateLogSettings } from '@/actions/settings'
import { useTerminology } from '@/contexts/terminology-context'

interface LogSettingsValues {
  logsPerPage: number
  defaultSort: 'NEWEST' | 'OLDEST'
}

interface LogSettingsFormProps {
  defaultValues: LogSettingsValues
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

export function LogSettingsForm({ defaultValues }: LogSettingsFormProps) {
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<LogSettingsValues>(defaultValues)

  function set<K extends keyof LogSettingsValues>(key: K, value: LogSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateLogSettings(values)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display</p>

        <SettingRow
          label={`${terms.logs} per page`}
          description={`How many ${terms.logs.toLowerCase()} to show in the list at once`}
          control={
            <CustomSelect
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              value={String(values.logsPerPage)}
              onChange={v => set('logsPerPage', Number(v))}
              triggerClassName="w-20"
            />
          }
        />
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</p>

        <SettingRow
          label="Default sort order"
          description={`How ${terms.logs.toLowerCase()} are ordered when no sort is applied`}
          control={
            <CustomSelect
              options={[
                { value: 'NEWEST', label: 'Newest first' },
                { value: 'OLDEST', label: 'Oldest first' },
              ]}
              value={values.defaultSort}
              onChange={v => set('defaultSort', v as 'NEWEST' | 'OLDEST')}
              triggerClassName="w-36"
            />
          }
        />
      </div>

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
