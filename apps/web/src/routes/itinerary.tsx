import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ItineraryClient } from './itinerary/itinerary-client'
import { getItineraryData } from '@/lib/api/itinerary'

const DEFAULTS = {
  stops: [],
  calendars: [],
}

export default function Itinerary() {
  const { user } = useAuth()

  const { data } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItineraryData,
    enabled: !!user,
    retry: false,
  })

  return (
    <ItineraryClient
      stops={data?.stops ?? DEFAULTS.stops}
      calendars={data?.calendars ?? DEFAULTS.calendars}
    />
  )
}
