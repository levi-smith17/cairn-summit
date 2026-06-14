import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getPublicInvite } from '../../shared/invites'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const token = event.pathParameters?.token
        if (!token) return toApiGatewayResponse(badRequest('Missing token'))

        const invite = await getPublicInvite(token)
        if (!invite) return toApiGatewayResponse(notFound('Invitation not found'))

        return toApiGatewayResponse(ok(invite))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
