import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PublicHeader } from '@/components/nav/public/public-header'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TerminologyToggle } from '@/components/nav/header-toggles'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'

interface ManifestHeaderProps {
  wayfarer: { username: string; name: string | null; email: string | null; avatar: string | null }
  currentWayfarer: { name: string | null; email: string | null; avatar: string | null } | null
  terminology: TerminologyStyle
  onTerminologyToggle?: () => void
  showAvatar: boolean
  backTo?: string
  backLabel?: string
}

export function ManifestHeader({ wayfarer, currentWayfarer, terminology, onTerminologyToggle = () => {}, showAvatar, backTo, backLabel }: ManifestHeaderProps) {
  const initials = wayfarer.name
    ? wayfarer.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : wayfarer.email?.[0].toUpperCase() ?? '?'

  const terms = getTerms(terminology)

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between py-2 px-4 bg-header border-b print:hidden">
      <div className="flex items-center gap-2">
        {backTo && (
          <>
            <Link to={backTo}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2 hover:bg-black/10 dark:hover:bg-white/10">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{backLabel ?? terms.manifest}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to {backLabel ?? terms.manifest}</TooltipContent>
              </Tooltip>
            </Link>
            <div className="w-px h-5 bg-foreground/20" />
          </>
        )}

        <div className={`flex items-center gap-3 transition-opacity duration-200 ${showAvatar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={wayfarer.avatar ?? undefined} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm hidden sm:inline">{wayfarer.name ?? wayfarer.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <PublicHeader
          wayfarer={currentWayfarer}
          terms={terms}
          terminologyToggle={<TerminologyToggle terminology={terminology} onToggle={onTerminologyToggle} />}
        />
      </div>
    </div>
  )
}
