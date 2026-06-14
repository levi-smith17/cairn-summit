import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ItineraryClient } from './itinerary/itinerary-client'
import { fetchItineraryEvents, getItineraryCalendars } from '@/lib/api/itinerary'

export default function Itinerary() {
  const { user } = useAuth()

  const { data: calendars = [] } = useQuery({
    queryKey: ['itinerary-calendars'],
    queryFn: getItineraryCalendars,
    enabled: !!user,
    retry: false,
  })

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['itinerary-events'],
    queryFn: () => fetchItineraryEvents(),
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <ItineraryClient
      stops={[]}
      calendars={calendars}
      events={events}
      eventsLoading={eventsLoading}
    />
  )
}
