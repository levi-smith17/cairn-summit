import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resolveProfileImage } from '@/lib/profile-image'
import { Separator } from '@/components/ui/separator'
import { SummaryExcerpt } from './summary-excerpt'
import { ExternalLink, MapPin, Globe, Link2, GitBranch, Mail } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WayfarerOverviewProps {
  name: string | null
  email: string | null
  image: string | null
  headline: string | null
  summary: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
  username: string | null
}

export function WayfarerOverview({
  name,
  email,
  image,
  headline,
  summary,
  location,
  website,
  linkedin,
  github,
  username,
}: WayfarerOverviewProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : email?.[0].toUpperCase() ?? '?'

  return (
    <div className="rounded-xl bg-muted/50 p-6 flex flex-col gap-4 relative">
      {username && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={`/manifest/${username}`}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            View your public Manifest
          </TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={resolveProfileImage(image) ?? undefined} alt={name ?? 'Wayfarer'} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{name ?? email}</p>
          </div>
          {headline && (
            <p className="text-sm text-muted-foreground">{headline}</p>
          )}
          {location && (
            <p className="text-sm text-muted-foreground">{location}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        {email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span>{email}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{location}</span>
          </div>
        )}
        {website && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              {website}
            </a>
          </div>
        )}
        {linkedin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4 shrink-0" />
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              {linkedin}
            </a>
          </div>
        )}
        {github && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4 shrink-0" />
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-4"
            >
              {github}
            </a>
          </div>
        )}
      </div>

      {summary && <SummaryExcerpt summary={summary} />}
    </div>
  )
}
