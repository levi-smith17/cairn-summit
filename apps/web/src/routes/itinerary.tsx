import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ItineraryClient } from './itinerary/itinerary-client'
import { getItineraryData } from '@/lib/api/itinerary'

const DEFAULTS = {
  stops: [],
  markers: [],
  calendars: [],
}

export default function Itinerary() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItineraryData,
    enabled: !!user,
  })

  function onRefresh() {
    queryClient.invalidateQueries({ queryKey: ['itinerary'] })
  }

  return (
    <ItineraryClient
      stops={data?.stops ?? DEFAULTS.stops}
      markers={data?.markers ?? DEFAULTS.markers}
      calendars={data?.calendars ?? DEFAULTS.calendars}
      onRefresh={onRefresh}
    />
  )
}
