import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/contexts/terminology-context'
import { getKin } from '@/lib/api/headwaters'
import type { Kin } from '@cairn/types'
import { HeadwatersClient } from './headwaters/headwaters-client'
import { HeadwatersSkeleton } from '@/components/ui/page-skeleton'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'kin-form'; kinId: string | null }

export const WAYFARER_SEED_ID = '__wayfarer__'

function parseName(fullName: string): { givenName: string; middleName?: string; surname: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { givenName: parts[0], surname: '' }
  if (parts.length === 2) return { givenName: parts[0], surname: parts[1] }
  return {
    givenName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    surname: parts[parts.length - 1],
  }
}

export default function Headwaters() {
  const { user } = useAuth()
  const { terms } = useTerminology()
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })

  const kinQuery = useQuery({
    queryKey: ['headwaters', 'kin'],
    queryFn: getKin,
    enabled: !!user,
  })

  if (isInitialRouteLoad([kinQuery])) {
    return <HeadwatersSkeleton title={terms.headwaters} />
  }

  const kins = kinQuery.data ?? []

  const wayfarerSeed = useMemo<Kin | null>(() => {
    if (kins.length > 0 || !user) return null
    const rawName = user.name ?? user.email.split('@')[0]
    const { givenName, middleName, surname } = parseName(rawName)
    return {
      pk: `USER#${user.id}`,
      sk: `KIN#${WAYFARER_SEED_ID}`,
      givenName,
      middleName,
      surname,
      fatherUnknown: false,
      motherUnknown: false,
      bloodlines: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, [kins.length, user])

  const displayKins = kins.length > 0 ? kins : wayfarerSeed ? [wayfarerSeed] : []

  return (
    <HeadwatersClient
      kins={displayKins}
      wayfarerSeedId={wayfarerSeed ? WAYFARER_SEED_ID : null}
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['headwaters'] })}
      panel={panel}
      onSetPanel={setPanel}
    />
  )
}
