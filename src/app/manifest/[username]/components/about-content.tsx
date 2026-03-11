'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Globe, Mail } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'
import { ManifestStickyHeader } from './sticky-header'
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
                                <a href={origins.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                                    {origins.website}
                                </a>
                            </div>
                        )}
                        {origins?.linkedin && (
                            <a href={origins.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                                LinkedIn
                            </a>
                        )}
                        {origins?.github && (
                            <a href={origins.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
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

                {/* Footer */}
                <div className="flex justify-center pt-8">
                    <p className="text-xs text-muted-foreground">
                        Built with{' '}
                        <a href="/" className="underline underline-offset-4 hover:text-foreground">
                            Cairn
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}