'use client'

import { Folder } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { useTerminology } from '@/contexts/terminology-context'

interface TrailFilterProps {
  value: string
  onChange: (value: string) => void
  trails: { id: string; name: string }[]
}

export function TrailFilter({ value, onChange, trails }: TrailFilterProps) {
  const { terms } = useTerminology()
  if (trails.length === 0) return null

  const options = [
    { value: 'all', label: `All ${terms.trails}` },
    ...trails.map(t => ({ value: t.id, label: t.name })),
  ]

  return (
    <CustomSelect
      options={options}
      value={value}
      onChange={onChange}
      icon={Folder}
      placeholderValue="all"
      triggerClassName="w-full md:w-36"
    />
  )
}
