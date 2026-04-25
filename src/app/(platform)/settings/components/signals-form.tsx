'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { CustomSelect } from '@/components/ui/custom-select'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updateSignalSettings } from '@/actions/settings'
import { useTerminology } from '@/contexts/terminology-context'
import { EmailForm } from './email-form'
import type { ImapAccountEntry } from './settings-client'

interface SignalSettingsValues {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  defaultView: 'SIGNALS' | 'EMAIL'
  compactView: boolean
  showSnippets: boolean
}

interface SignalsFormProps {
  accounts: ImapAccountEntry[]
  defaultValues: SignalSettingsValues
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description: string
  control: React.ReactNode
}) {
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

export function SignalsForm({ accounts, defaultValues }: SignalsFormProps) {
  const { terms } = useTerminology()
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<SignalSettingsValues>(defaultValues)

  function set<K extends keyof SignalSettingsValues>(key: K, value: SignalSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      await updateSignalSettings(values)
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Email accounts ── */}
      <EmailForm accounts={accounts} />

      <Separator />

      <form onSubmit={onSubmit} className="space-y-8">
        {/* ── Display settings ── */}
        <div className="space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display</p>

          <SettingRow
            label="Messages per page"
            description="How many messages to show in the list at once"
            control={
              <CustomSelect
                options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]}
                value={String(values.messagesPerPage)}
                onChange={v => set('messagesPerPage', Number(v))}
                triggerClassName="w-20"
              />
            }
          />

          <SettingRow
            label="Compact view"
            description="Reduce row height to show more messages on screen"
            control={
              <Switch
                checked={values.compactView}
                onCheckedChange={v => set('compactView', v)}
              />
            }
          />

          <SettingRow
            label="Show message previews"
            description="Display a preview of message content in the list"
            control={
              <Switch
                checked={values.showSnippets}
                onCheckedChange={v => set('showSnippets', v)}
              />
            }
          />
        </div>

        <Separator />

        {/* ── Behavior settings ── */}
        <div className="space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</p>

          <SettingRow
            label="Default view"
            description={`Which tab opens when you navigate to ${terms.signals}`}
            control={
              <CustomSelect
                options={[{ value: 'SIGNALS', label: terms.signals }, { value: 'EMAIL', label: 'Email' }]}
                value={values.defaultView}
                onChange={v => set('defaultView', v as 'SIGNALS' | 'EMAIL')}
                triggerClassName="w-28"
              />
            }
          />

          <SettingRow
            label="Auto-mark as read"
            description="Mark messages as read when you open them"
            control={
              <Switch
                checked={values.autoMarkRead}
                onCheckedChange={v => set('autoMarkRead', v)}
              />
            }
          />

          <SettingRow
            label="Auto-refresh interval"
            description={`How often to check for new ${terms.signals.toLowerCase()}`}
            control={
              <CustomSelect
                options={[
                  { value: '0', label: 'Off' },
                  { value: '15', label: '15 seconds' },
                  { value: '30', label: '30 seconds' },
                  { value: '60', label: '1 minute' },
                  { value: '300', label: '5 minutes' },
                ]}
                value={String(values.autoRefreshInterval)}
                onChange={v => set('autoRefreshInterval', Number(v))}
                triggerClassName="w-32"
              />
            }
          />
        </div>

        <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
      </form>
    </div>
  )
}
