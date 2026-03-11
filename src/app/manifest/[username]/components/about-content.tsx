'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Globe, Mail } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'
import { ManifestStickyHeader } from './sticky-header'
import { ManifestFooter } from './manifest-footer'
import { format } from 'date-fns'
import { formatAge } from '@/lib/format-age'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'

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
    birthday?: Date | null
    bio?: string | null
    passed?: boolean
    media: CompanionMedia[]
}

interface AboutContentProps {
    username: string
    wayfarer: {
        name: string | null
        email: string | null
        image: string | null
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
    currentUser: {
        name: string | null
        email: string | null
        avatar: string | null
    } | null
    showDirectoryLink: boolean
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

function mediaFilename(key: string) {
    return key.split('/').pop()
}

function CompanionMediaCarousel({ companion }: { companion: Companion }) {
    const media = companion.media ?? []

    return (
        <>
            {companion.bio && (
                <RichTextContent html={companion.bio} className="text-muted-foreground" />
            )}
            {media.length > 0 && (
                <Carousel className="w-full" opts={{ loop: true }}>
                    <CarouselContent>
                        {media.map((m) => (
                            <CarouselItem key={m.id}>
                                <div className="flex flex-col gap-2">
                                    <div className="rounded-lg overflow-hidden bg-transparent flex items-center justify-center h-96">
                                        {m.type === 'IMAGE' ? (
                                            <img
                                                src={`/api/public/companions/media/${mediaFilename(m.key)}`}
                                                alt={m.caption ?? companion.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <video
                                                src={`/api/public/companions/media/${mediaFilename(m.key)}`}
                                                className="w-full h-full object-contain"
                                                controls
                                            />
                                        )}
                                    </div>
                                    {m.caption && (
                                        <p className="text-xs text-muted-foreground text-center">{m.caption}</p>
                                    )}
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

export function AboutContent({
    username,
    wayfarer,
    origins,
    companions,
    currentUser,
    showDirectoryLink,
}: AboutContentProps) {
    const headerRef = useRef<HTMLDivElement>(null)
    const [showStickyHeader, setShowStickyHeader] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyHeader(!entry.isIntersecting),
            { threshold: 0, rootMargin: '0px' }
        )
        if (headerRef.current) observer.observe(headerRef.current)
        return () => observer.disconnect()
    }, [])

    const { setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const defaultApplied = sessionStorage.getItem(`manifest-theme-init-${username}`)
        if (!defaultApplied) {
            sessionStorage.setItem(`manifest-theme-init-${username}`, '1')
            if (wayfarer.defaultTheme === 'LIGHT') setTheme('light')
            else if (wayfarer.defaultTheme === 'DARK') setTheme('dark')
        }
    }, [])

    const [terminology, setTerminology] = useState<TerminologyStyle>(
        wayfarer.defaultTerminology
    )

    useEffect(() => {
        const stored = sessionStorage.getItem(`manifest-terminology-${username}`)
        if (stored === 'CAIRN' || stored === 'STANDARD') setTerminology(stored)
    }, [])

    const initials = wayfarer.name
        ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : wayfarer.email?.[0].toUpperCase() ?? '?'

    const terms = getTerms(terminology)

    return (
        <div className="relative">
            {/* Sticky top bar */}
            <ManifestStickyHeader
                username={username}
                wayfarer={wayfarer}
                terminology={terminology}
                onTerminologyToggle={() => setTerminology(t => {
                    const next = t === 'CAIRN' ? 'STANDARD' : 'CAIRN'
                    sessionStorage.setItem(`manifest-terminology-${username}`, next)
                    return next
                })}
                showAvatar={showStickyHeader}
                showDirectoryLink={showDirectoryLink}
                currentUser={currentUser}
                backHref={`/manifest/${username}`}
            />

            <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-12">
                <div className="flex flex-col gap-6">
                    {/* Full header */}
                    <div ref={headerRef} className="flex items-center gap-4 pt-8">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={wayfarer.image ?? undefined} />
                            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold">{wayfarer.name ?? wayfarer.email}</h1>
                            {origins?.headline && (
                                <p className="text-muted-foreground">{origins.headline}</p>
                            )}
                        </div>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {origins?.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {origins.location}
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <a href={`/manifest/${username}/contact`} className="hover:text-foreground underline underline-offset-4">
                                Contact {wayfarer.name ?? username}
                            </a>
                        </div>
                        {origins?.website && (
                            <div className="flex items-center gap-1">
                                <Globe className="h-4 w-4" />
                                <a href={origins.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline underline-offset-4">
                                    {origins.website}
                                </a>
                            </div>
                        )}
                        {origins?.linkedin && (
                            <a href={origins.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground underline underline-offset-4">
                                LinkedIn
                            </a>
                        )}
                        {origins?.github && (
                            <a href={origins.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground underline underline-offset-4">
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                GitHub
                            </a>
                        )}
                    </div>
                </div>

                {/* Bio */}
                {origins?.bio && (
                    <Section title={terms.bio}>
                        <RichTextContent html={origins.bio} className="text-muted-foreground" />
                    </Section>
                )}

                {/* Companions */}
                {companions.length > 0 && (() => {
                    const activeCompanions = companions.filter(c => !c.passed)
                    const passedCompanions = companions.filter(c => c.passed)

                    return (
                        <>
                            {activeCompanions.length > 0 && (
                                <Section title={terms.companions}>
                                    <div className="flex flex-col gap-8">
                                        {activeCompanions.map((companion) => (
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
                                        {passedCompanions.map((companion) => (
                                            <div key={companion.id} className="flex flex-col gap-3">
                                                <div>
                                                    <h3 className="font-medium">{companion.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {companion.species}
                                                        {companion.breed ? ` · ${companion.breed}` : ''}
                                                        {companion.birthday && !companion.passed && (
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
                        </>
                    )
                })()}

                <ManifestFooter />
            </div>
        </div>
    )
}