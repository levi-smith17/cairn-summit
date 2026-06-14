import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { acceptInvitation } from '../../shared/invites'
import { toApiGatewayResponse, ok, badRequest, notFound, conflict, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const token = event.pathParameters?.token
        if (!token) return toApiGatewayResponse(badRequest('Missing token'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.email) return toApiGatewayResponse(badRequest('email is required'))

        const result = await acceptInvitation(token, body.email)
        if (!result.ok) {
            if (result.status === 404) return toApiGatewayResponse(notFound('Invitation not found'))
            if (result.status === 409) return toApiGatewayResponse(conflict('Invitation already used'))
            if (result.status === 410) return toApiGatewayResponse(conflict('Invitation expired'))
            return toApiGatewayResponse(badRequest('Email does not match invitation'))
        }

        return toApiGatewayResponse(ok({ accepted: true }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
