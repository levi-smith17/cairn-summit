import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getUserId } from '../../shared/auth'
import { s3, PUBLIC_MEDIA_BUCKET } from '../../shared/s3'
import { toApiGatewayResponse, badRequest, forbidden, noContent, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const key = event.queryStringParameters?.key
        if (!key) return toApiGatewayResponse(badRequest('key is required'))

        const userId = getUserId(event)

        if (!key.startsWith(`companions/${userId}/`)) {
            return toApiGatewayResponse(forbidden('Access denied'))
        }

        await s3.send(new DeleteObjectCommand({
            Bucket: PUBLIC_MEDIA_BUCKET,
            Key: key,
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}