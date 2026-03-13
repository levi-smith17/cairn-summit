'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTerminology } from '@/contexts/terminology-context'

interface TrailFilterProps {
  value: string
  onChange: (value: string) => void
  trails: { id: string; name: string }[]
}

export function TrailFilter({ value, onChange, trails }: TrailFilterProps) {
  const { terms } = useTerminology()
  if (trails.length === 0) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-32 overflow-hidden [&_span]:truncate [&_span]:block">
        <SelectValue placeholder={`All ${terms.trails}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {terms.trails}</SelectItem>
        {trails.map(trail => (
          <SelectItem key={trail.id} value={trail.id}>
            {trail.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
