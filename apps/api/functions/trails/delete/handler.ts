import { DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing trail id'))
        }

        const pk = getPk(event)

        // Find all waypoints assigned to this trail via GSI1
        const waypointsResult = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'gsi1',
            KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :prefix)',
            ExpressionAttributeValues: {
                ':gsi1pk': `TRAIL#${id}`,
                ':prefix': 'WAYPOINT#',
            },
        }))

        await Promise.all([
            dynamo.send(new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: `TRAIL#${id}` },
            })),
            ...(waypointsResult.Items ?? []).map(w =>
                dynamo.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk: w.sk },
                    UpdateExpression: 'REMOVE trailId, gsi1pk, gsi1sk',
                }))
            ),
        ])

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}