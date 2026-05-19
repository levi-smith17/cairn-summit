import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface Section {
  label: string
  count: number
}

interface Expedition {
  title: string
  company: string
  current: boolean
  endDate: string | Date | null
}

interface Training {
  institution: string
  degree: string | null
}

interface Gear {
  name: string
  level: string | null
}

interface ManifestSummaryProps {
  sections: Section[]
  mostRecentExpedition: Expedition | null
  mostRecentTraining: Training | null
  topGear: Gear[]
  totalYearsExperience: number
}

export function ManifestSummary({
  sections,
  mostRecentExpedition,
  mostRecentTraining,
  topGear,
  totalYearsExperience,
}: ManifestSummaryProps) {
  return (
    <div className="rounded-xl bg-muted/50 p-6 flex flex-col gap-4">
      <h2 className="text-lg font-medium">Manifest Overview</h2>

      {(mostRecentExpedition || mostRecentTraining || totalYearsExperience > 0 || topGear.length > 0) && (
        <>
          <div className="flex flex-col gap-3">
            {totalYearsExperience > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Experience</span>
                <span className="font-medium">{totalYearsExperience} yrs</span>
              </div>
            )}
            {mostRecentExpedition && (
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Current Role</span>
                <span className="font-medium text-right truncate">
                  {mostRecentExpedition.title} · {mostRecentExpedition.company}
                </span>
              </div>
            )}
            {mostRecentTraining && (
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Training</span>
                <span className="font-medium text-right truncate">
                  {mostRecentTraining.degree
                    ? `${mostRecentTraining.degree} · ${mostRecentTraining.institution}`
                    : mostRecentTraining.institution}
                </span>
              </div>
            )}
            {topGear.length > 0 && (
              <div className="flex items-start justify-between text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Top Gear</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {topGear.map((item) => (
                    <span
                      key={item.name}
                      className="rounded-full border px-2 py-0.5 text-xs"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      <div className="flex flex-col gap-2">
        {sections.map((section) => {
          const complete = section.count > 0
          return (
            <div
              key={section.label}
              className={cn(
                'flex items-center justify-between text-sm',
                complete ? 'text-foreground' : 'text-muted-foreground/50'
              )}
            >
              <span>{section.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  complete
                    ? 'bg-success text-[#1F3300]'
                    : 'bg-muted text-muted-foreground/50'
                )}
              >
                {complete ? section.count : 'Empty'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
