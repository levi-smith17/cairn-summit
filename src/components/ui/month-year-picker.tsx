'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MonthYearPickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i)

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const date = value ? new Date(value + 'T12:00:00') : null
  const selectedMonth = date ? String(date.getMonth()) : ''
  const selectedYear = date ? String(date.getFullYear()) : ''

  function handleChange(month: string, year: string) {
    if (month !== '' && year !== '') {
      const mm = String(Number(month) + 1).padStart(2, '0')
      onChange(`${year}-${mm}-01`)
    } else {
      onChange('')
    }
  }

  return (
    <div className="flex gap-2">
      <Select
        value={selectedMonth}
        onValueChange={val => handleChange(val, selectedYear)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedYear}
        onValueChange={val => handleChange(selectedMonth, val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
