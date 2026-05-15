import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { s3, PRIVATE_MEDIA_BUCKET } from '../../shared/s3'
import { toApiGatewayResponse, ok, badRequest, forbidden, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const key = event.queryStringParameters?.key
        if (!key) return toApiGatewayResponse(badRequest('key is required'))

        const userId = getUserId(event)

        if (!key.startsWith(`receipts/${userId}/`)) {
            return toApiGatewayResponse(forbidden('Access denied'))
        }

        const pk = getPk(event)

        // Find the expense that owns this receipt
        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            FilterExpression: 'receiptUrl = :key',
            ExpressionAttributeValues: { ':pk': pk, ':prefix': 'BURN#', ':key': key },
            ProjectionExpression: 'sk',
        }))

        const expense = result.Items?.[0]
        if (!expense) return toApiGatewayResponse(notFound('Receipt not found'))

        // Delete from S3 and clear from DynamoDB in parallel
        await Promise.all([
            s3.send(new DeleteObjectCommand({ Bucket: PRIVATE_MEDIA_BUCKET, Key: key })),
            dynamo.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: expense.sk },
                UpdateExpression: 'REMOVE receiptUrl',
            })),
        ])

        return toApiGatewayResponse(ok({ deleted: true }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
