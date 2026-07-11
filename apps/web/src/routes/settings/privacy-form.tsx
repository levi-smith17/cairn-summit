import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CustomSelect } from '@/components/ui/custom-select'
import { FormActions } from '@/components/forms/form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { updatePrivacySettings, updateListedSetting } from '@/lib/api/settings'

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
  const { saving, saved, error, handleSubmit } = useFormStatus()
  const [values, setValues] = useState<PrivacyValues>(defaultValues)

  function set<K extends keyof PrivacyValues>(key: K, value: PrivacyValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    await handleSubmit(async () => {
      const { listed, ...privacyValues } = values
      await Promise.all([
        updatePrivacySettings(privacyValues),
        updateListedSetting(listed),
      ])
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manifest</p>

        <SettingRow
          label="Visibility"
          description="Who can view your public Manifest page"
          control={
            <CustomSelect
              options={[{ value: 'PUBLIC', label: 'Public' }, { value: 'UNLISTED', label: 'Unlisted' }, { value: 'PRIVATE', label: 'Private' }]}
              value={values.manifestVisibility}
              onChange={v => set('manifestVisibility', v as PrivacyValues['manifestVisibility'])}
              triggerClassName="w-32"
            />
          }
        />

        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p><strong>Public</strong> — anyone with the link can view your Manifest.</p>
          <p><strong>Unlisted</strong> — accessible via direct link; directory listing still depends on “Listed in directory”.</p>
          <p><strong>Private</strong> — only you (or an admin) can view it when logged in. Hidden from the directory.</p>
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

      <FormActions saving={saving} saved={saved} error={error} saveLabel="Save Changes" />
    </form>
  )
}
