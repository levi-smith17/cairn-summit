'use client'

import { BookUser, Pin, PinOff, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { useInspectorPin } from '@/contexts/inspector-pin-context'
import { useTerminology } from '@/contexts/terminology-context'
import { getProfile } from '@/lib/api/profile'
import { cn } from '@/lib/utils'

const iconButtonClass =
  'rounded-md p-2 text-foreground/85 transition-colors hover:bg-muted-hover hover:text-foreground'

export function HeaderSearchTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('cairn:open-search'))}
          className={iconButtonClass}
          aria-label="Search everywhere"
        >
          <Search className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Search everywhere (⌘K)</TooltipContent>
    </Tooltip>
  )
}

export function HeaderInspectorPin() {
  const { pinned, setPinned } = useInspectorPin()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setPinned(!pinned)}
          className={cn(iconButtonClass, pinned && 'bg-primary/15 text-primary')}
          aria-pressed={pinned}
          aria-label={pinned ? 'Unpin inspector' : 'Pin inspector'}
        >
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {pinned
          ? 'Unpin inspector — panel closes when nothing is selected'
          : 'Pin inspector — stay in editing mode while you work'}
      </TooltipContent>
    </Tooltip>
  )
}

export function HeaderPublicManifest() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  })
  const username = profile?.username ?? null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={!username}
          onClick={() => username && window.open(`/manifest/${username}`, '_blank')}
          className={cn(iconButtonClass, !username && 'opacity-40 cursor-not-allowed')}
          aria-label={`View public ${terms.manifest}`}
        >
          <BookUser className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {username ? `View public ${terms.manifest}` : `Set a username to view your public ${terms.manifest}`}
      </TooltipContent>
    </Tooltip>
  )
}

export function PlatformHeaderActions({
  trailing,
}: {
  /** Rendered after search/pin/manifest — typically primary Add buttons on the far right. */
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <HeaderSearchTrigger />
      <HeaderInspectorPin />
      <HeaderPublicManifest />
      {trailing}
    </div>
  )
}
