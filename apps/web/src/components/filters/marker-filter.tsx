'use client'

import { MarkerPicker } from '@/components/ui/marker-picker'
import { useTerminology } from '@/contexts/terminology-context'

interface MarkerFilterProps {
  value: string[]
  onChange: (ids: string[]) => void
  markers: { id: string; name: string; color: string; icon: string | null }[]
}

export function MarkerFilter({ value, onChange, markers }: MarkerFilterProps) {
  const { terms } = useTerminology()
  if (markers.length === 0) return null

  return (
    <div className="w-full md:w-auto">
      <MarkerPicker
        markers={markers}
        selected={value}
        onChange={onChange}
        placeholder={`All ${terms.markers}`}
      />
    </div>
  )
}
