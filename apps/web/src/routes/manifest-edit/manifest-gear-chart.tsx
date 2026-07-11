import {
  LabelList,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ManifestGear } from '@/lib/api/manifest'

type GearLevel = NonNullable<ManifestGear['level']>

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

export function ManifestGearChart({
  category,
  items,
  selectedEntryId,
  onSelectItem,
}: {
  category: string
  items: ManifestGear[]
  selectedEntryId?: string | null
  onSelectItem?: (id: string) => void
}) {
  const withLevel = items.filter((item): item is ManifestGear & { level: GearLevel } => item.level != null)
  const data = withLevel.map((item) => ({
    id: item.id,
    name: item.name,
    value: levelValue[item.level],
    fill: levelFill[item.level],
    levelLabel: levelLabel[item.level],
    labelFill: levelLabelFill[item.level],
  }))

  if (data.length === 0) return null

  return (
    <div
      className="w-full rounded-lg border border-border bg-card"
      data-inspectable
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{category}</h3>
      </div>
      <div className="px-2 py-3">
        <ResponsiveContainer width="100%" height={280}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="15%"
            outerRadius="85%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const entry = payload[0]?.payload as (typeof data)[number] | undefined
                if (!entry) return null
                return (
                  <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md">
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-muted-foreground">{entry.levelLabel}</p>
                  </div>
                )
              }}
            />
            <RadialBar
              dataKey="value"
              background={{ fill: 'var(--color-muted)' }}
              className={onSelectItem ? 'cursor-pointer' : undefined}
              onClick={(entry) => {
                const id = (entry as { id?: string }).id
                if (id && onSelectItem) onSelectItem(id)
              }}
            >
              <LabelList
                position="insideStart"
                dataKey="name"
                fontSize={11}
                className="fill-black capitalize"
                formatter={(value) =>
                  data.find((entry) => entry.name === value && entry.labelFill === '#000000')
                    ? String(value)
                    : ''
                }
              />
              <LabelList
                position="insideStart"
                dataKey="name"
                fontSize={11}
                className="fill-white capitalize mix-blend-luminosity"
                formatter={(value) =>
                  data.find((entry) => entry.name === value && entry.labelFill === '#ffffff')
                    ? String(value)
                    : ''
                }
              />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        {onSelectItem ? (
          <ul className="mt-1 space-y-1 px-2 pb-1">
            {withLevel.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-inspectable
                  onClick={() => onSelectItem(item.id)}
                  className={
                    selectedEntryId === item.id
                      ? 'text-sm font-medium text-foreground'
                      : 'text-sm text-muted-foreground hover:text-foreground'
                  }
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
