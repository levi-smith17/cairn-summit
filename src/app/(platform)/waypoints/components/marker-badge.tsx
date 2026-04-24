import * as lucide from 'lucide-react'

interface MarkerBadgeProps {
  marker: {
    name: string
    color: string
    icon?: string | null
  }
}

export function MarkerBadge({ marker }: MarkerBadgeProps) {
  const Icon = marker.icon ? (lucide as any)[marker.icon] as lucide.LucideIcon | undefined : null

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${marker.color}20`, color: marker.color }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {marker.name}
    </span>
  )
}