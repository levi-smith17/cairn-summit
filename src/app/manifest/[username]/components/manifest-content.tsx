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
    Globe,
    Mail,
    MapPin,
} from 'lucide-react'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { Timeline } from '@/components/ui/timeline'
import { format } from 'date-fns'
import { ManifestStickyHeader } from './sticky-header'
import { GearChart } from './gear-chart'
import { ManifestFooter } from './manifest-footer'

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
}: ManifestContentProps) {

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
        <div className="relative manifest-page">
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
                currentUser={currentUser}
            />

            <div className="max-w-3xl mx-auto px-6 pb-6 flex flex-col gap-12 print:max-w-none print:px-0 print:mx-0 print:pb-0">
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
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <Link href={`/manifest/${username}/contact`} className="hover:text-foreground underline underline-offset-4">
                                Contact {wayfarer.name ?? username}
                            </Link>
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

                    {/* Summary */}
                    {origins?.summary && (
                        <RichTextContent html={origins.summary} className="text-muted-foreground" />
                    )}
                    {/* About link */}
                    <div className="flex justify-end print:hidden">
                        <Link href={`/manifest/${username}/journey`}>
                            <Button variant="outline" size="sm">
                                {terms.bio_button}
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
                        {/* Screen: radial chart grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:hidden">
                            {Object.entries(grouped).map(([category, items]) => (
                                <GearChart key={category} category={category} items={items as Parameters<typeof GearChart>[0]['items']} />
                            ))}
                        </div>
                        {/* Print: plain text list */}
                        <div className="hidden print:flex print:flex-wrap print:gap-x-8 print:gap-y-4">
                            {Object.entries(grouped).map(([category, items]) => (
                                <div key={category} className="flex flex-col gap-1">
                                    <p className="text-sm font-semibold">{category}</p>
                                    <ul className="text-sm text-muted-foreground list-none p-0 m-0 flex flex-col gap-0.5">
                                        {items.map((item) => (
                                            <li key={item.id}>
                                                {item.name}{item.level ? ` — ${item.level}` : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
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

                <ManifestFooter />
            </div>
        </div>
    )
}