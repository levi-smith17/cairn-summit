import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getPk } from '../../shared/auth'
import { fetchUserItineraryEvents } from '../../shared/itinerary-events'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)
        const qs = event.queryStringParameters ?? {}

        const from = qs.from ? new Date(qs.from) : undefined
        const to = qs.to ? new Date(qs.to) : undefined

        const result = await fetchUserItineraryEvents(pk, from, to)
        return toApiGatewayResponse(ok(result))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
