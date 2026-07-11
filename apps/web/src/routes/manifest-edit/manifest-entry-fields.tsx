import { Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import type { ManifestGear } from '@/lib/api/manifest'
import { cn } from '@/lib/utils'

export function SwitchField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  )
}

export function ManifestTextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function ManifestMonthField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type="month"
        value={value ? value.slice(0, 7) : ''}
        onChange={(event) =>
          onChange(event.target.value ? `${event.target.value}-01` : null)
        }
      />
    </label>
  )
}

export function ManifestDateRangeFields({
  startDate,
  endDate,
  current,
  onStartDateChange,
  onEndDateChange,
  onCurrentChange,
}: {
  startDate: string
  endDate: string | null
  current: boolean
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string | null) => void
  onCurrentChange: (value: boolean) => void
}) {
  return (
    <>
      <ManifestMonthField
        label="Start date"
        value={startDate}
        onChange={(value) => value && onStartDateChange(value)}
      />
      <SwitchField label="Current" checked={current} onCheckedChange={onCurrentChange} />
      {!current ? (
        <ManifestMonthField label="End date" value={endDate} onChange={onEndDateChange} />
      ) : null}
    </>
  )
}

export function ManifestPlainTextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        placeholder={placeholder ?? 'Notes…'}
        rows={rows}
        className={cn(
          'flex min-h-[5rem] w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      />
    </label>
  )
}

export const GEAR_LEVEL_OPTIONS = [
  { value: '', label: 'No level' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
]

export function ManifestGearLevelField({
  value,
  onChange,
}: {
  value: ManifestGear['level']
  onChange: (value: ManifestGear['level']) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Level</span>
      <CustomSelect
        value={value ?? ''}
        onChange={(next) => onChange((next || null) as ManifestGear['level'])}
        options={GEAR_LEVEL_OPTIONS}
        triggerClassName="h-9 w-full"
      />
    </label>
  )
}
