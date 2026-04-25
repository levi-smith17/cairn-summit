'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'

interface DateRangeFilterProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateRangeFilterProps) {
  const hasDate = dateFrom || dateTo

  function clearDates(e: React.MouseEvent) {
    e.stopPropagation()
    onDateFromChange('')
    onDateToChange('')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm w-full md:w-auto">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={`flex-1 text-left truncate ${hasDate ? '' : 'text-muted-foreground'}`}>
            {dateFrom && dateTo
              ? `${format(new Date(dateFrom), 'MMM d')} — ${format(new Date(dateTo), 'MMM d')}`
              : dateFrom
              ? `From ${format(new Date(dateFrom), 'MMM d')}`
              : dateTo
              ? `To ${format(new Date(dateTo), 'MMM d')}`
              : 'Date Range'}
          </span>
          {hasDate && (
            <span
              role="button"
              onClick={clearDates}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 flex flex-col gap-3" align="start">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground font-medium">From</p>
          <Calendar
            mode="single"
            selected={dateFrom ? new Date(dateFrom) : undefined}
            onSelect={d => onDateFromChange(d ? format(d, 'yyyy-MM-dd') : '')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground font-medium">To</p>
          <Calendar
            mode="single"
            selected={dateTo ? new Date(dateTo) : undefined}
            onSelect={d => onDateToChange(d ? format(d, 'yyyy-MM-dd') : '')}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
