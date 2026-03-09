import { icons } from 'lucide-react'

interface TagBadgeProps {
  tag: {
    name: string
    color: string
    icon?: string | null
  }
}

export function TagBadge({ tag }: TagBadgeProps) {
  const Icon = tag.icon ? icons[tag.icon as keyof typeof icons] : null

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {tag.name}
    </span>
  )
}