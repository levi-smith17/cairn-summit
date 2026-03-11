'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'
import { getTerms, type TerminologyStyle } from '@/lib/terminology'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
    ExternalLink,
    MapPin,
    Globe,
    Mail
} from 'lucide-react'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Timeline } from '@/components/ui/timeline'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ManifestStickyHeader } from './sticky-header'
import { GearChart } from './gear-chart'


const formatDate = (date: Date) => format(date, 'MMM yyyy')

interface ManifestContentProps {
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
        location: string | null
        website: string | null
        linkedin: string | null
        github: string | null
    } | null
    expeditions: {
        id: string
        title: string
        company: string
        location: string | null
        startDate: Date
        endDate: Date | null
        current: boolean
        description: string | null
    }[]
    training: {
        id: string
        institution: string
        degree: string | null
        field: string | null
        startDate: Date
        endDate: Date | null
        current: boolean
        description: string | null
    }[]
    gear: {
        id: string
        name: string
        category: string | null
        level: string | null
    }[]
    landmarks: {
        id: string
        name: string
        description: string | null
        url: string | null
        startDate: Date | null
        endDate: Date | null
        current: boolean
    }[]
    summits: {
        id: string
        title: string
        issuer: string | null
        date: Date | null
        description: string | null
        url: string | null
    }[]
    pathfinding: {
        id: string
        organization: string
        role: string | null
        location: string | null
        startDate: Date
        endDate: Date | null
        current: boolean
        description: string | null
    }[]
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
                <Separator className="flex-1" />
            </div>
            {children}
        </section>
    )
}

function DateRange({ startDate, endDate, current }: { startDate: Date; endDate: Date | null; current: boolean }) {
    return (
        <span className="text-sm text-muted-foreground">
            {format(startDate, 'MMM yyyy')} — {current ? 'Present' : endDate ? format(endDate, 'MMM yyyy') : ''}
        </span>
    )
}

export function ManifestContent({
    username,
    wayfarer,
    origins,
    expeditions,
    training,
    gear,
    landmarks,
    summits,
    pathfinding,
    currentUser,
    showDirectoryLink,
}: ManifestContentProps) {
    const router = useRouter()

    const headerRef = useRef<HTMLDivElement>(null)
    const [showStickyHeader, setShowStickyHeader] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyHeader(!entry.isIntersecting),
            { threshold: 0 }
        )
        if (headerRef.current) observer.observe(headerRef.current)
        return () => observer.disconnect()
    }, [])

    const { resolvedTheme, setTheme } = useTheme()
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
    const terms = getTerms(terminology)

    const initials = wayfarer.name
        ? wayfarer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : wayfarer.email?.[0].toUpperCase() ?? '?'

    const grouped = gear.reduce<Record<string, typeof gear>>((acc, item) => {
        const key = item.category ?? 'Other'
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
    }, {})

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
            />

            <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-12">
                <div className="flex flex-col gap-6">
                    {/* Full header — observed for scroll detection */}
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
                        {wayfarer.email && (
                            <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${wayfarer.email}`} className="hover:text-foreground">
                                    {wayfarer.email}
                                </a>
                            </div>
                        )}
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

                    {/* Summary */}
                    {origins?.summary && (
                        <RichTextContent html={origins.summary} className="text-muted-foreground" />
                    )}
                    {/* About link */}
                    <div className="flex justify-end">
                        <Link href={`/manifest/${username}/journey`}>
                            <Button variant="outline" size="sm">
                                {terms.about}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Expeditions */}
                {expeditions.length > 0 && (
                    <Section title={terms.expeditions}>
                        <Timeline
                            items={expeditions.map((exp) => ({
                                title: exp.title,
                                subtitle: exp.company,
                                location: exp.location,
                                startDate: exp.startDate,
                                endDate: exp.endDate,
                                current: exp.current,
                                description: exp.description,
                                formatDate,
                            }))}
                        />
                    </Section>
                )}

                {/* Training */}
                {training.length > 0 && (
                    <Section title={terms.training}>
                        <Timeline
                            items={training.map((t) => ({
                                title: t.institution,
                                subtitle: t.degree ?? undefined,
                                location: t.field ?? undefined,
                                startDate: t.startDate,
                                endDate: t.endDate,
                                current: t.current,
                                description: t.description,
                                formatDate,
                            }))}
                        />
                    </Section>
                )}

                {/* Gear */}
                {gear.length > 0 && (
                    <Section title={terms.gear}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {Object.entries(grouped).map(([category, items]) => (
                                <GearChart key={category} category={category} items={items as Parameters<typeof GearChart>[0]['items']} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* Landmarks */}
                {landmarks.length > 0 && (
                    <Section title={terms.landmarks}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {landmarks.map((l) => (
                                <div key={l.id} className="rounded-lg border p-4 flex flex-col gap-2 bg-secondary">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium">{l.name}</p>
                                        {l.url && (
                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground shrink-0"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                    {l.startDate && (
                                        <DateRange startDate={l.startDate} endDate={l.endDate} current={l.current} />
                                    )}
                                    {l.description && (
                                        <RichTextContent html={l.description} className="text-muted-foreground text-sm" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}


                {/* Summits */}
                {summits.length > 0 && (
                    <Section title={terms.summits}>
                        {summits.map((s) => (
                            <div key={s.id} className="flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{s.title}</p>
                                            {s.url && (
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                                                >
                                                    Link
                                                </a>
                                            )}
                                        </div>
                                        {s.issuer && <p className="text-sm text-muted-foreground">{s.issuer}</p>}
                                    </div>
                                    {s.date && (
                                        <span className="text-sm text-muted-foreground shrink-0">
                                            {format(s.date, 'MMM yyyy')}
                                        </span>
                                    )}
                                </div>
                                {s.description && (
                                    <RichTextContent html={s.description} className="text-muted-foreground" />
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                {/* Pathfinding */}
                {pathfinding.length > 0 && (
                    <Section title={terms.pathfinding}>
                        {pathfinding.map((p) => (
                            <div key={p.id} className="flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium">{p.organization}</p>
                                        {p.role && <p className="text-sm text-muted-foreground">{p.role}</p>}
                                        {p.location && <p className="text-sm text-muted-foreground">{p.location}</p>}
                                    </div>
                                    <DateRange startDate={p.startDate} endDate={p.endDate} current={p.current} />
                                </div>
                                {p.description && (
                                    <RichTextContent html={p.description} className="text-muted-foreground" />
                                )}
                            </div>
                        ))}
                    </Section>
                )}

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