'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { OriginsForm } from './origins-form'
import { ExpeditionsForm } from './expeditions-form'
import { TrainingForm } from './training-form'
import { GearForm } from './gear-form'
import { LandmarksForm } from './landmarks-form'
import { PathfindingForm } from './pathfinding-form'
import { SettingsForm } from './settings-form'
import { SummitsForm } from './summits-form'

const tabs = [
    { value: 'origins', label: 'Origins' },
    { value: 'expeditions', label: 'Expeditions' },
    { value: 'training', label: 'Training' },
    { value: 'gear', label: 'Gear' },
    { value: 'landmarks', label: 'Landmarks' },
    { value: 'summits', label: 'Summits' },
    { value: 'pathfinding', label: 'Pathfinding' },
    { value: 'settings', label: 'Settings' },
]

interface ManifestTabsProps {
    origins: any
    expeditions: any[]
    training: any[]
    gear: any[]
    landmarks: any[]
    summits: any[]
    pathfinding: any[]
    settings: {
        username: string | null
        listed: boolean
        defaultTerminology: 'CAIRN' | 'STANDARD'
        defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
    }
}

export function ManifestTabs({
    origins,
    expeditions,
    training,
    gear,
    landmarks,
    summits,
    pathfinding,
    settings,
}: ManifestTabsProps) {
    const [activeTab, setActiveTab] = useState('origins')

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-6">
            {/* Mobile dropdown */}
            <div className="md:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Section:</span>
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {tabs.map((tab) => (
                            <SelectItem key={tab.value} value={tab.value}>
                                {tab.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop tabs */}
            <TabsList className="hidden md:flex h-auto w-full">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex-1"
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Content */}
            <div className="flex-1">
                <TabsContent value="origins">
                    <OriginsForm defaultValues={{
                        headline: origins?.headline ?? '',
                        summary: origins?.summary ?? '',
                        location: origins?.location ?? '',
                        website: origins?.website ?? '',
                        linkedin: origins?.linkedin ?? '',
                        github: origins?.github ?? '',
                    }} />
                </TabsContent>

                <TabsContent value="expeditions">
                    <ExpeditionsForm expeditions={expeditions} />
                </TabsContent>

                <TabsContent value="training">
                    <TrainingForm training={training} />
                </TabsContent>

                <TabsContent value="gear">
                    <GearForm gear={gear} />
                </TabsContent>

                <TabsContent value="landmarks">
                    <LandmarksForm landmarks={landmarks} />
                </TabsContent>

                <TabsContent value="summits">
                    <SummitsForm summits={summits} />
                </TabsContent>

                <TabsContent value="pathfinding">
                    <PathfindingForm pathfinding={pathfinding} />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsForm defaultValues={settings} />
                </TabsContent>
            </div>
        </Tabs>
    )
}