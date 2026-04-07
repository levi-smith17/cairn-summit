'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const router = useRouter()
  const { terms } = useTerminology()
  const [saving, startSave] = useTransition()

  const [values, setValues] = useState<SignalSettingsValues>(defaultValues)

  function set<K extends keyof SignalSettingsValues>(key: K, value: SignalSettingsValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(defaultValues)

  function handleSave() {
    startSave(async () => {
      await updateSignalSettings(values)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Email accounts ── */}
      <EmailForm accounts={accounts} />

      <Separator />

      {/* ── Display settings ── */}
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display</p>

        <SettingRow
          label="Messages per page"
          description="How many messages to show in the list at once"
          control={
            <Select
              value={String(values.messagesPerPage)}
              onValueChange={v => set('messagesPerPage', Number(v))}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={values.defaultView}
              onValueChange={v => set('defaultView', v as 'SIGNALS' | 'EMAIL')}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIGNALS">{terms.signals}</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={String(values.autoRefreshInterval)}
              onValueChange={v => set('autoRefreshInterval', Number(v))}
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end items-center gap-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
