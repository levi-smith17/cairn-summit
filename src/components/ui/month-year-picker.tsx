'use client'

import { useState, useEffect } from 'react'
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
  const [month, setMonth] = useState(date ? String(date.getMonth()) : '')
  const [year, setYear] = useState(date ? String(date.getFullYear()) : '')

  useEffect(() => {
    const d = value ? new Date(value + 'T12:00:00') : null
    setMonth(d ? String(d.getMonth()) : '')
    setYear(d ? String(d.getFullYear()) : '')
  }, [value])

  function handleMonthChange(val: string) {
    setMonth(val)
    if (val !== '' && year !== '') {
      const mm = String(Number(val) + 1).padStart(2, '0')
      onChange(`${year}-${mm}-01`)
    }
  }

  function handleYearChange(val: string) {
    setYear(val)
    if (month !== '' && val !== '') {
      const mm = String(Number(month) + 1).padStart(2, '0')
      onChange(`${val}-${mm}-01`)
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={month} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={handleYearChange}>
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
