import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ManifestSummary } from './manifest-edit/manifest-summary'
import { ManifestSections } from './manifest-edit/manifest-sections'
import { WayfarerOverview } from './manifest-edit/wayfarer-overview'
import { PlatformHeader } from '@/components/nav/platform/platform-header'
import { getManifestData } from '@/lib/api/manifest'
import { useTerminology } from '@/contexts/terminology-context'

export default function Manifest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { terms } = useTerminology()

  const { data } = useQuery({
    queryKey: ['manifest'],
    queryFn: getManifestData,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['manifest'] })
  }

  const origins = data?.origins ?? null
  const expeditions = data?.expeditions ?? []
  const training = data?.training ?? []
  const gear = data?.gear ?? []
  const landmarks = data?.landmarks ?? []
  const summits = data?.summits ?? []
  const pathfinding = data?.pathfinding ?? []
  const companions = data?.companions ?? []

  return (
    <>
      <PlatformHeader title={`My ${terms.manifest}`} />
      <div className="flex flex-col flex-1 min-h-0 gap-4 p-4 overflow-hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 shrink-0">
          <WayfarerOverview
            name={data?.user?.name ?? null}
            email={data?.user?.email ?? null}
            image={data?.user?.image ?? null}
            headline={origins?.headline ?? null}
            summary={origins?.summary ?? null}
            location={origins?.location ?? null}
            website={origins?.website ?? null}
            linkedin={origins?.linkedin ?? null}
            github={origins?.github ?? null}
            username={data?.username ?? null}
          />
          <ManifestSummary
            sections={[
              { label: terms.expeditions, count: expeditions.length },
              { label: terms.training,    count: training.length },
              { label: terms.gear,        count: gear.length },
              { label: terms.landmarks,   count: landmarks.length },
              { label: terms.summits,     count: summits.length },
              { label: terms.pathfinding, count: pathfinding.length },
              { label: terms.companions,  count: companions.length },
            ]}
            mostRecentExpedition={expeditions[0] ?? null}
            mostRecentTraining={training[0] ?? null}
            topGear={gear.slice(0, 3)}
            totalYearsExperience={
              expeditions.reduce((total: number, exp: { startDate: string; current: boolean; endDate: string | null }) => {
                const start = new Date(exp.startDate)
                const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date()
                return total + (end.getFullYear() - start.getFullYear())
              }, 0)
            }
          />
        </div>
        <ManifestSections
          origins={origins}
          expeditions={expeditions}
          training={training}
          gear={gear}
          landmarks={landmarks}
          summits={summits}
          pathfinding={pathfinding}
          companions={companions}
          isAdmin={data?.isAdmin ?? false}
          onRefresh={onRefresh}
        />
      </div>
    </>
  )
}
