'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarkerBadge } from '@/app/(platform)/waypoints/components/marker-badge'
import { useTerminology } from '@/contexts/terminology-context'

interface MarkerFilterProps {
  value: string
  onChange: (value: string) => void
  markers: { id: string; name: string; color: string; icon: string | null }[]
}

export function MarkerFilter({ value, onChange, markers: markers }: MarkerFilterProps) {
  const { terms } = useTerminology()
  if (markers.length === 0) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-32 overflow-hidden [&_span]:truncate [&_span]:block">
        <SelectValue placeholder={`All ${terms.markers}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {terms.markers}</SelectItem>
        {markers.map(marker => (
          <SelectItem key={marker.id} value={marker.id}>
            <MarkerBadge marker={marker} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}