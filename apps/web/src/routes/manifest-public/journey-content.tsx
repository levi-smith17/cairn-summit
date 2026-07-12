import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'
import { ManifestContactInfo } from './manifest-contact-info'
import { format } from 'date-fns'
import { formatAge } from '@/lib/format-age'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

const CLOUDFRONT_PUBLIC_MEDIA_URL = import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL ?? ''

interface CompanionMedia {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order: number
}

interface Companion {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: string | null
  bio?: string | null
  passed?: boolean
  media: CompanionMedia[]
}

interface JourneyContentProps {
  wayfarer: {
    username: string
    name: string | null
    email: string | null
    avatar: string | null
    defaultTerminology: TerminologyStyle
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
  }
  origins: {
    headline: string | null
    summary: string | null
    bio: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
  } | null
  companions: Companion[]
  onContactClick?: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold shrink-0">{title}</h2>
        <Separator className="flex-1 bg-header" />
      </div>
      {children}
    </section>
  )
}

function publicMediaUrl(key: string) {
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key}`
}

function CompanionMediaCarousel({ companion }: { companion: Companion }) {
  const media = companion.media ?? []
  return (
    <>
      {companion.bio && <RichTextContent html={companion.bio} className="text-muted-foreground" />}
      {media.length > 0 && (
        <Carousel className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {media.map(m => (
              <CarouselItem key={m.id}>
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg overflow-hidden bg-transparent flex items-center justify-center h-96">
                    {m.type === 'IMAGE' ? (
                      <img src={publicMediaUrl(m.key)} alt={m.caption ?? companion.name} className="w-full h-full object-contain" />
                    ) : (
                      <video src={publicMediaUrl(m.key)} className="w-full h-full object-contain" controls />
                    )}
                  </div>
                  {m.caption && <p className="text-xs text-muted-foreground text-center">{m.caption}</p>}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {media.length > 1 && (
            <>
              <CarouselPrevious variant="ghost" className="left-2 !bg-header border-0 opacity-90 hover:opacity-100" />
              <CarouselNext variant="ghost" className="right-2 !bg-header border-0 opacity-90 hover:opacity-100" />
            </>
          )}
        </Carousel>
      )}
    </>
  )
}

export function JourneyContent({
  wayfarer,
  origins,
  companions,
  onContactClick,
}: JourneyContentProps) {
  const { setTheme } = useTheme()

  useEffect(() => {
    const defaultApplied = sessionStorage.getItem(`manifest-theme-init-${wayfarer.username}`)
    if (!defaultApplied) {
      sessionStorage.setItem(`manifest-theme-init-${wayfarer.username}`, '1')
      if (wayfarer.defaultTheme === 'LIGHT') setTheme('light')
      else if (wayfarer.defaultTheme === 'DARK') setTheme('dark')
    }
  }, [])

  const [terminology, setTerminology] = useState<TerminologyStyle>(wayfarer.defaultTerminology)

  useEffect(() => {
    const stored = sessionStorage.getItem(`manifest-terminology-${wayfarer.username}`)
    if (stored === 'CAIRN' || stored === 'STANDARD') setTerminology(stored)
  }, [])

  const initials = wayfarer.name
    ? wayfarer.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : wayfarer.email?.[0].toUpperCase() ?? '?'

  const terms = getTerms(terminology)

  const activeCompanions = companions.filter(c => !c.passed)
  const passedCompanions = companions.filter(c => c.passed)

  return (
    <div className="relative">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 pb-6 pt-2">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 pt-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={wayfarer.avatar ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">{wayfarer.name ?? wayfarer.email}</h1>
              {origins?.headline && <p className="text-muted-foreground">{origins.headline}</p>}
            </div>
          </div>
          <ManifestContactInfo
            wayfarer={wayfarer}
            origins={origins}
            onContactClick={onContactClick}
          />
        </div>

        {origins?.bio && (
          <Section title={terms.bio}>
            <RichTextContent html={origins.bio} className="text-muted-foreground" />
          </Section>
        )}

        {activeCompanions.length > 0 && (
          <Section title={terms.companions}>
            <div className="flex flex-col gap-8">
              {activeCompanions.map(companion => (
                <div key={companion.id} className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-medium">{companion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companion.species}
                      {companion.breed ? ` · ${companion.breed}` : ''}
                      {companion.birthday && (
                        ` · ${format(new Date(companion.birthday), 'MMM d, yyyy')} · ${formatAge(new Date(companion.birthday))}`
                      )}
                    </p>
                  </div>
                  <CompanionMediaCarousel companion={companion} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {passedCompanions.length > 0 && (
          <Section title={terms.summit_reached}>
            <div className="flex flex-col gap-8">
              {passedCompanions.map(companion => (
                <div key={companion.id} className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-medium">{companion.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {companion.species}
                      {companion.breed ? ` · ${companion.breed}` : ''}
                    </p>
                  </div>
                  <CompanionMediaCarousel companion={companion} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
