import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const host = event.queryStringParameters?.host
        if (!host) return toApiGatewayResponse(badRequest('host is required'))

        // Scan is acceptable — low-frequency public endpoint, small table
        const result = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk AND customDomain = :domain',
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
                ':domain': host,
            },
            ProjectionExpression: 'username',
        }))

        const username = (result.Items?.[0]?.username as string) ?? null

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
            body: JSON.stringify({ data: { username } }),
        }
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
