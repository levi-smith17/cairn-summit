import { MapPin, Users, Wrench } from 'lucide-react'
import type { Terms } from '@/lib/terminology'

interface OutpostStatsProps {
  totalWayfarers: number
  topGear: { name: string; count: number }[]
  topLocations: { location: string; count: number }[]
  terms: Terms
}

function StatCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

export function OutpostStats({ totalWayfarers, topGear, topLocations, terms }: OutpostStatsProps) {
  return (
    <div className="flex flex-col gap-4">
      <StatCard title={terms.wayfarers} icon={<Users className="h-4 w-4" />}>
        <p className="text-3xl font-semibold">{totalWayfarers}</p>
      </StatCard>

      <StatCard title={`Top ${terms.gear}`} icon={<Wrench className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {topGear.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-1">
              <span className="rounded-full border px-3 py-1 text-xs">{name}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </StatCard>

      <StatCard title="Top Locations" icon={<MapPin className="h-4 w-4" />}>
        <div className="flex flex-col gap-2">
          {topLocations.map(({ location, count }) => (
            <div key={location} className="flex items-center justify-between text-sm">
              <span>{location}</span>
              <span className="text-muted-foreground text-xs">{count}</span>
            </div>
          ))}
        </div>
      </StatCard>
    </div>
  )
}
