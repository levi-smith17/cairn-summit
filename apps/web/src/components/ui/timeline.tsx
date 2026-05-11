import { cn } from '@/lib/utils'
import { RichTextContent } from '@/components/ui/rich-text-content'

interface TimelineItemProps {
  title: string
  subtitle?: string | null
  location?: string | null
  startDate: Date
  endDate?: Date | null
  current?: boolean
  description?: string | null
  formatDate: (date: Date) => string
}

interface TimelineProps {
  items: TimelineItemProps[]
  className?: string
}

function TimelineItem({
  title,
  subtitle,
  location,
  startDate,
  endDate,
  current,
  description,
  formatDate,
}: TimelineItemProps) {
  return (
    <div className="relative pl-6 pb-8 last:pb-0 print:break-inside-avoid">
      {/* Vertical line */}
      <div className="absolute left-0 top-2 bottom-0 w-px bg-border last:hidden" />
      {/* Dot */}
      <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-foreground ring-2 ring-background" />

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium leading-tight">{title}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {location && (
              <p className="text-sm text-muted-foreground">{location}</p>
            )}
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {formatDate(startDate)} — {current ? 'Present' : endDate ? formatDate(endDate) : ''}
          </span>
        </div>
        {description && (
          <RichTextContent html={description} className="text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => (
        <TimelineItem key={index} {...item} />
      ))}
    </div>
  )
}