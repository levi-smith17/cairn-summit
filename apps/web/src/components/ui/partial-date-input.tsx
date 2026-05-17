import { useState } from 'react'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

interface PartialDateInputProps {
  value: string
  onChange: (value: string) => void
}

export function PartialDateInput({ value, onChange }: PartialDateInputProps) {
  const parts = (value ?? '').split('-')
  const [year, setYear] = useState(parts[0] ?? '')
  const [month, setMonth] = useState(parts[1] ?? '')
  const [day, setDay] = useState(parts[2] ?? '')

  function emit(y: string, m: string, d: string) {
    if (!y || y.length < 4) { onChange(''); return }
    let result = y
    if (m) {
      result += `-${m}`
      if (d) result += `-${d.padStart(2, '0')}`
    }
    onChange(result)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Select
        value={month}
        onValueChange={m => {
          if (m === '__clear__') {
            setMonth('')
            setDay('')
            emit(year, '', '')
          } else {
            setMonth(m)
            emit(year, m, day)
          }
        }}
      >
        <SelectTrigger className="w-32 md:h-8 text-sm">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {month && (
            <SelectItem value="__clear__" className="text-muted-foreground text-xs">
              — clear —
            </SelectItem>
          )}
          {MONTHS.map(m => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {month && (
        <Input
          placeholder="DD"
          value={day}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 2)
            setDay(d)
            emit(year, month, d)
          }}
          className="w-14 md:h-8 text-sm"
        />
      )}

      <Input
        placeholder="YYYY"
        value={year}
        onChange={e => {
          const y = e.target.value.replace(/\D/g, '').slice(0, 4)
          setYear(y)
          emit(y, month, day)
        }}
        className="w-20 md:h-8 text-sm"
      />
    </div>
  )
}
