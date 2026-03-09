'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagBadge } from '@/app/(platform)/waypoints/components/tag-badge'

interface TagFilterProps {
  value: string
  onChange: (value: string) => void
  tags: { id: string; name: string; color: string; icon: string | null }[]
}

export function TagFilter({ value, onChange, tags }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-32 overflow-hidden [&_span]:truncate [&_span]:block">
        <SelectValue placeholder="All Tags" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Tags</SelectItem>
        {tags.map(tag => (
          <SelectItem key={tag.id} value={tag.id}>
            <TagBadge tag={tag} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}