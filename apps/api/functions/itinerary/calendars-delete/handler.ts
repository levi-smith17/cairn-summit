import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, DeleteParameterCommand } from '@aws-sdk/client-ssm'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getPathId } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const ssm = new SSMClient({ region: process.env.AWS_REGION })
        const id = getPathId(event)
        if (!id) return toApiGatewayResponse(badRequest('Missing itinerary id'))

        const pk = getPk(event)
        const sk = `ITINERARY#${id}`

        // Fetch first to get SSM path before deleting
        const existing = await dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk } }))

        if (existing.Item?.ssmPasswordPath) {
            await ssm.send(new DeleteParameterCommand({ Name: existing.Item.ssmPasswordPath })).catch(() => {
                // SSM parameter may already be gone — not fatal
            })
        }

        await dynamo.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk, sk } }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
