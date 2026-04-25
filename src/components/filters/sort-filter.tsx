'use client'

import { ArrowUpDown } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { DEFAULT_FILTERS, SortOption } from '@/lib/filters'

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
    <CustomSelect
      options={options}
      value={value}
      onChange={v => onChange(v as SortOption)}
      icon={ArrowUpDown}
      placeholderValue={DEFAULT_FILTERS.sort}
      triggerClassName="w-full md:w-36"
    />
  )
}
