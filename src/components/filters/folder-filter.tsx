'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FolderFilterProps {
  value: string
  onChange: (value: string) => void
  folders: { id: string; name: string }[]
}

export function FolderFilter({ value, onChange, folders }: FolderFilterProps) {
  if (folders.length === 0) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-32 overflow-hidden [&_span]:truncate [&_span]:block">
        <SelectValue placeholder="All Folders" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Folders</SelectItem>
        {folders.map(folder => (
          <SelectItem key={folder.id} value={folder.id}>
            {folder.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}