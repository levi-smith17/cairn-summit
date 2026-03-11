'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadialBarChart, RadialBar, LabelList, Tooltip, ResponsiveContainer } from 'recharts'

type GearLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

interface GearItem {
    id: string
    name: string
    level: GearLevel | null
}

interface GearChartProps {
    category: string
    items: GearItem[]
}

const levelValue: Record<GearLevel, number> = {
    BEGINNER: 25,
    INTERMEDIATE: 50,
    ADVANCED: 75,
    EXPERT: 100,
}

const levelLabel: Record<GearLevel, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    EXPERT: 'Expert',
}

const levelFill: Record<GearLevel, string> = {
    BEGINNER: '#dce9b5',
    INTERMEDIATE: '#8aaa52',
    ADVANCED: '#4e6a24',
    EXPERT: '#2e4110',
}

const levelLabelFill: Record<GearLevel, string> = {
    BEGINNER: '#000000',
    INTERMEDIATE: '#000000',
    ADVANCED: '#ffffff',
    EXPERT: '#ffffff',
}

export function GearChart({ category, items }: GearChartProps) {
    const withLevel = items.filter(i => i.level !== null)

    const data = withLevel.map(item => ({
        name: item.name,
        value: levelValue[item.level!],
        fill: levelFill[item.level!],
        levelLabel: levelLabel[item.level!],
        labelFill: levelLabelFill[item.level!],
    }))

    return (
        <>
            {data.length > 0 && (
                <Card className="gap-2 w-full">
                    <CardHeader>
                        <CardTitle>
                            {category}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" aspect={1}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="15%"
                                outerRadius="85%"
                                data={data}
                                startAngle={-90}
                                endAngle={380}
                            >
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null
                                        const d = payload[0].payload
                                        return (
                                            <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                                                <p className="font-medium">{d.name}</p>
                                                <p className="text-muted-foreground">{d.levelLabel}</p>
                                            </div>
                                        )
                                    }}
                                />
                                <RadialBar dataKey="value" background={{ fill: 'var(--color-muted)' }}>
                                    <LabelList
                                        position="insideStart"
                                        dataKey="name"
                                        fontSize={11}
                                        className="fill-black capitalize"
                                        formatter={(value: unknown) =>
                                            data.find(d => d.name === value && d.labelFill === '#000000') ? String(value) : ''
                                        }
                                    />
                                    <LabelList
                                        position="insideStart"
                                        dataKey="name"
                                        fontSize={11}
                                        className="fill-white capitalize mix-blend-luminosity"
                                        formatter={(value: unknown) =>
                                            data.find(d => d.name === value && d.labelFill === '#ffffff') ? String(value) : ''
                                        }
                                    />
                                </RadialBar>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
