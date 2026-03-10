'use client'

import { useState } from 'react'
import { 
    ArrowLeft, 
    MapPin, 
    Briefcase, 
    GraduationCap, 
    Backpack, 
    Flag, 
    Trophy, 
    Compass,
    PawPrint,
    Settings 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OriginsForm } from './origins-form'
import { ExpeditionsForm } from './expeditions-form'
import { TrainingForm } from './training-form'
import { GearForm } from './gear-form'
import { LandmarksForm } from './landmarks-form'
import { SummitsForm } from './summits-form'
import { PathfindingForm } from './pathfinding-form'
import { CompanionsForm } from './companions-form'
import { SettingsForm } from './settings-form'
import type { Prisma } from '@prisma/client'

type Origins = Prisma.OriginsGetPayload<{}>
type Expedition = Prisma.ExpeditionGetPayload<{}>
type Training = Prisma.TrainingGetPayload<{}>
type Gear = Prisma.GearGetPayload<{}>
type Landmark = Prisma.LandmarkGetPayload<{}>
type Summit = Prisma.SummitGetPayload<{}>
type Pathfinding = Prisma.PathfindingGetPayload<{}>
type Companion = Prisma.CompanionGetPayload<{ include: { media: true } }>

interface ManifestSectionsProps {
    origins: Origins | null
    expeditions: Expedition[]
    training: Training[]
    gear: Gear[]
    landmarks: Landmark[]
    summits: Summit[]
    pathfinding: Pathfinding[]
    companions: Companion[]
    settings: {
        username: string | null
        listed: boolean
        defaultTerminology: 'CAIRN' | 'STANDARD'
        defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
    }
}

export function ManifestSections({ origins, expeditions, training, gear, landmarks, summits, pathfinding, companions, settings }: ManifestSectionsProps) {
    const [active, setActive] = useState<string | null>(null)

    const sections = [
        { value: 'origins',      label: 'Origins',      count: null,               icon: MapPin },
        { value: 'expeditions',  label: 'Expeditions',  count: expeditions.length, icon: Briefcase },
        { value: 'training',     label: 'Training',     count: training.length,    icon: GraduationCap },
        { value: 'gear',         label: 'Gear',         count: gear.length,        icon: Backpack },
        { value: 'landmarks',    label: 'Landmarks',    count: landmarks.length,   icon: Flag },
        { value: 'summits',      label: 'Summits',      count: summits.length,     icon: Trophy },
        { value: 'pathfinding',  label: 'Pathfinding',  count: pathfinding.length, icon: Compass },
        { value: 'companions',   label: 'Companions',   count: companions.length,  icon: PawPrint },
        { value: 'settings',     label: 'Settings',     count: null,               icon: Settings },
    ]

    function renderContent() {
        switch (active ?? 'origins') {
            case 'origins':     return <OriginsForm defaultValues={{ headline: origins?.headline ?? '', summary: origins?.summary ?? '', bio: origins?.bio ?? '', location: origins?.location ?? '', website: origins?.website ?? '', linkedin: origins?.linkedin ?? '', github: origins?.github ?? '' }} />
            case 'expeditions': return <ExpeditionsForm expeditions={expeditions} />
            case 'training':    return <TrainingForm training={training} />
            case 'gear':        return <GearForm gear={gear} />
            case 'landmarks':   return <LandmarksForm landmarks={landmarks} />
            case 'summits':     return <SummitsForm summits={summits} />
            case 'pathfinding': return <PathfindingForm pathfinding={pathfinding} />
            case 'companions':  return <CompanionsForm companions={companions} />
            case 'settings':    return <SettingsForm defaultValues={settings} />
        }
    }

    const selectedSection = active ?? 'origins'

    return (
        <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
            {/* Left — section nav */}
            <div className={`
                ${active !== null ? 'hidden md:flex' : 'flex'}
                flex-col w-full md:w-48 shrink-0 rounded-lg border border-border bg-card overflow-hidden
            `}>
                <div className="px-4 py-3 border-b border-border shrink-0">
                    <span className="text-sm font-medium">Sections</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sections.map(s => (
                        <div
                            key={s.value}
                            className={`
                                flex items-center justify-between px-4 py-3 border-b border-border/50
                                cursor-pointer transition-colors
                                ${selectedSection === s.value ? 'bg-primary/20' : 'hover:bg-muted/50'}
                            `}
                            onClick={() => setActive(s.value)}
                        >
                            <div className="flex items-center gap-2">
                                <s.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{s.label}</span>
                            </div>
                            {s.count !== null && s.count > 0 && (
                                <Badge variant="secondary" className="text-xs">{s.count}</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right — section content */}
            <div className={`
                ${active !== null ? 'flex' : 'hidden md:flex'}
                flex-col flex-1 rounded-lg border border-border bg-card overflow-hidden
            `}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setActive(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        {sections.find(s => s.value === selectedSection)?.label}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}
