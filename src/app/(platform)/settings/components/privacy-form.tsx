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
import { updatePrivacySettings, updateListedSetting } from '@/actions/settings'

interface PrivacyValues {
  manifestVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  contactFormEnabled: boolean
  listed: boolean
}

interface PrivacyFormProps {
  defaultValues: PrivacyValues
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

export function PrivacyForm({ defaultValues }: PrivacyFormProps) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [values, setValues] = useState<PrivacyValues>(defaultValues)

  function set<K extends keyof PrivacyValues>(key: K, value: PrivacyValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(defaultValues)

  function handleSave() {
    startSave(async () => {
      const { listed, ...privacyValues } = values
      await Promise.all([
        updatePrivacySettings(privacyValues),
        updateListedSetting(listed),
      ])
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manifest</p>

        <SettingRow
          label="Visibility"
          description="Who can view your public Manifest page"
          control={
            <Select value={values.manifestVisibility} onValueChange={v => set('manifestVisibility', v as PrivacyValues['manifestVisibility'])}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="UNLISTED">Unlisted</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p><strong>Public</strong> — anyone with the link can view your Manifest.</p>
          <p><strong>Unlisted</strong> — accessible via direct link but hidden from the directory.</p>
          <p><strong>Private</strong> — only you can view it when logged in.</p>
        </div>

        <SettingRow
          label="Listed in directory"
          description="Show your profile in the public Wayfarer directory on the homepage"
          control={
            <Switch
              checked={values.listed}
              onCheckedChange={v => set('listed', v)}
            />
          }
        />
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</p>

        <SettingRow
          label="Contact form"
          description="Allow visitors to send you messages through your Manifest page"
          control={
            <Switch
              checked={values.contactFormEnabled}
              onCheckedChange={v => set('contactFormEnabled', v)}
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
