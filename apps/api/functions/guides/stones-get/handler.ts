import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const guideId = event.pathParameters?.guideId

        if (!guideId) {
            return toApiGatewayResponse(badRequest('Missing guideId'))
        }

        const pk = getPk(event)

        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': `STONE#${guideId}#`,
            },
        }))

        const stones = (result.Items ?? []).map(item => ({
            pk: item.pk,
            sk: item.sk,
            id: item.sk.split('#').pop(),
            guideId: item.guideId,
            face: item.face,
            core: item.core,
            placement: item.placement,
            markers: item.markers ?? [],
            createdAt: item.createdAt,
        }))

        return toApiGatewayResponse(ok(stones))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
