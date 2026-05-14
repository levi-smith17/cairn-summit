import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id

        if (!id) {
            return toApiGatewayResponse(badRequest('Missing facility id'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (typeof body.x !== 'number' || typeof body.y !== 'number') {
            return toApiGatewayResponse(badRequest('x and y must be numbers'))
        }

        const pk = getPk(event)

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${id}` },
            UpdateExpression: 'SET #position = :pos',
            ExpressionAttributeNames: { '#position': 'position' },
            ExpressionAttributeValues: { ':pos': { x: body.x, y: body.y } },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
