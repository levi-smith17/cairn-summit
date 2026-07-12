import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ItineraryClient } from './itinerary/itinerary-client'
import { ItineraryStudioSkeleton } from '@/components/studio/ui/studio-skeletons'
import { isInitialRouteLoad } from '@/hooks/use-route-ready'
import { fetchItineraryEvents, getItineraryCalendars } from '@/lib/api/itinerary'

export default function Itinerary() {
  const { user } = useAuth()

  const calendarsQuery = useQuery({
    queryKey: ['itinerary-calendars'],
    queryFn: getItineraryCalendars,
    enabled: !!user,
    retry: false,
  })

  const eventsQuery = useQuery({
    queryKey: ['itinerary-events'],
    queryFn: () => fetchItineraryEvents(),
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  if (isInitialRouteLoad([calendarsQuery, eventsQuery])) {
    return <ItineraryStudioSkeleton />
  }

  return (
    <ItineraryClient
      stops={[]}
      calendars={calendarsQuery.data ?? []}
      events={eventsQuery.data?.events ?? []}
      calendarSync={eventsQuery.data?.calendarSync ?? []}
    />
  )
}
