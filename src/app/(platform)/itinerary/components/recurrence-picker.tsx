'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rruleToValues, valuesToRRule, defaultRecurrence, type RecurrenceValues, type RecurrenceFrequency } from '@/lib/recurrence'

const FREQ_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none',     label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekday', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'biweekly',label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]

const DAY_OPTIONS = [
  { abbr: 'SU', label: 'S' },
  { abbr: 'MO', label: 'M' },
  { abbr: 'TU', label: 'T' },
  { abbr: 'WE', label: 'W' },
  { abbr: 'TH', label: 'T' },
  { abbr: 'FR', label: 'F' },
  { abbr: 'SA', label: 'S' },
]

interface RecurrencePickerProps {
  value: string | null        // RRULE string or null
  startDate: Date
  onChange: (rrule: string | null) => void
}

export function RecurrencePicker({ value, startDate, onChange }: RecurrencePickerProps) {
  const [rv, setRv] = useState<RecurrenceValues>(() => rruleToValues(value, startDate))

  // Sync when external value changes (e.g. form reset)
  useEffect(() => {
    setRv(rruleToValues(value, startDate))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function update(partial: Partial<RecurrenceValues>) {
    const next = { ...rv, ...partial }
    setRv(next)
    onChange(valuesToRRule(next))
  }

  function toggleDay(abbr: string) {
    const days = rv.days.includes(abbr)
      ? rv.days.filter(d => d !== abbr)
      : [...rv.days, abbr]
    update({ days: days.length ? days : [abbr] }) // keep at least one
  }

  const showDays  = rv.frequency === 'weekly' || rv.frequency === 'biweekly'
  const showEnds  = rv.frequency !== 'none'

  return (
    <div className="space-y-3">
      {/* Frequency */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Repeat</Label>
        <Select
          value={rv.frequency}
          onValueChange={v => update({ frequency: v as RecurrenceFrequency })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQ_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day-of-week picker (weekly / biweekly) */}
      {showDays && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">On</Label>
          <div className="flex gap-1">
            {DAY_OPTIONS.map(({ abbr, label }) => (
              <button
                key={abbr}
                type="button"
                onClick={() => toggleDay(abbr)}
                className={`h-7 w-7 rounded-full text-xs font-medium transition-colors ${
                  rv.days.includes(abbr)
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:border-foreground/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* End condition */}
      {showEnds && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ends</Label>
          <Select
            value={rv.endType}
            onValueChange={v => update({ endType: v as RecurrenceValues['endType'] })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="date">On date</SelectItem>
              <SelectItem value="count">After</SelectItem>
            </SelectContent>
          </Select>

          {rv.endType === 'date' && (
            <Input
              type="date"
              value={rv.endDate}
              onChange={e => update({ endDate: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          )}
          {rv.endType === 'count' && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={1}
                max={999}
                value={rv.endCount}
                onChange={e => update({ endCount: parseInt(e.target.value) || 1 })}
                className="h-8 text-sm w-20"
              />
              <span className="text-sm text-muted-foreground">occurrences</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
