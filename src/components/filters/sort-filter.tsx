'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SortOption } from '@/lib/filters'

interface SortFilterProps {
  value: SortOption
  onChange: (value: SortOption) => void
  options?: { value: SortOption; label: string }[]
}

const DEFAULT_OPTIONS = [
  { value: 'newest' as SortOption, label: 'Newest First' },
  { value: 'oldest' as SortOption, label: 'Oldest First' },
  { value: 'alpha' as SortOption, label: 'Alphabetical' },
]

export function SortFilter({ value, onChange, options = DEFAULT_OPTIONS }: SortFilterProps) {
  return (
    <Select value={value} onValueChange={v => onChange(v as SortOption)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}