'use client'

import Link from 'next/link'
import { BookType, ChevronLeft, LayoutList } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PublicNav } from '@/components/nav/public-nav'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'

interface ManifestStickyHeaderProps {
  username: string
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
  }
  terminology: TerminologyStyle
  onTerminologyToggle: () => void
  showAvatar: boolean
  showDirectoryLink: boolean
  currentUser: {
    name: string | null
    email: string | null
    avatar: string | null
  } | null
  backHref?: string
  backLabel?: string
}

export function ManifestStickyHeader({
  username,
  wayfarer,
  terminology,
  onTerminologyToggle,
  showAvatar,
  showDirectoryLink,
  currentUser,
  backHref,
  backLabel,
}: ManifestStickyHeaderProps) {
  const initials = wayfarer.name
    ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : wayfarer.email?.[0].toUpperCase() ?? '?'

  const terms = getTerms(terminology)

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between py-2 px-4 bg-header border-b">
      {/* Left side — back button + avatar */}
      <div className="flex items-center gap-2">
        {backHref && (
          <>
            <Link href={backHref}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2 hover:bg-black/10 dark:hover:bg-white/10">
                    <ChevronLeft className="h-4 w-4" />
                    {backLabel ?? terms.page}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Back to {backLabel ?? terms.page}
                </TooltipContent>
              </Tooltip>
            </Link>
            <div className="w-px h-5 bg-foreground/20" />
          </>
        )}

        <div className={`flex items-center gap-3 transition-opacity duration-200 ${showAvatar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={wayfarer.image ?? undefined} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{wayfarer.name ?? wayfarer.email}</span>
        </div>
      </div>

      {/* Right side — directory + terminology toggle */}
      <div className="flex items-center gap-2 ml-auto">
        <PublicNav
          currentUser={currentUser}
          terminologyToggle={
            <>
              {showDirectoryLink && (
                <Link href="/">
                  <Button variant="secondary" size="sm" className="rounded-none hover:bg-black/10 dark:hover:bg-white/10" asChild>
                    <span className="flex items-center gap-1.5">
                      <LayoutList className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-none gap-2 hover:bg-black/10 dark:hover:bg-white/10"
                    onClick={onTerminologyToggle}
                  >
                    <BookType className="h-4 w-4" />
                    {terminology === 'CAIRN' ? 'Standard' : 'Cairn'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {terminology === 'CAIRN'
                    ? 'Switch to standard resume terminology'
                    : 'Switch to Cairn terminology'}
                </TooltipContent>
              </Tooltip>
            </>
          }
        />
      </div>
    </div>
  )
}