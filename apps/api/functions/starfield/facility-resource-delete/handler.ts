import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const facilityId = event.pathParameters?.facilityId
        const resourceId = event.pathParameters?.resourceId

        if (!facilityId || !resourceId) {
            return toApiGatewayResponse(badRequest('Missing facilityId or resourceId'))
        }

        const pk = getPk(event)

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${facilityId}` },
            UpdateExpression: 'REMOVE #resources.#rid',
            ExpressionAttributeNames: {
                '#resources': 'resources',
                '#rid': resourceId,
            },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
