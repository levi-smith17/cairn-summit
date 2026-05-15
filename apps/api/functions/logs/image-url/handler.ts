import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getUserId } from '../../shared/auth'
import { s3, PRIVATE_MEDIA_BUCKET, PRESIGN_EXPIRES } from '../../shared/s3'
import { toApiGatewayResponse, badRequest, forbidden, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const key = event.queryStringParameters?.key
        if (!key) return toApiGatewayResponse(badRequest('key is required'))

        const userId = getUserId(event)

        // Verify the key is scoped to this user
        if (!key.startsWith(`logs/${userId}/`)) {
            return toApiGatewayResponse(forbidden('Access denied'))
        }

        const presignedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: PRIVATE_MEDIA_BUCKET, Key: key }),
            { expiresIn: PRESIGN_EXPIRES },
        )

        return {
            statusCode: 302,
            headers: {
                'Location': presignedUrl,
                'Cache-Control': 'private, max-age=3600',
                'Access-Control-Allow-Origin': process.env.WEB_URL ?? '*',
            },
            body: '',
        }
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
