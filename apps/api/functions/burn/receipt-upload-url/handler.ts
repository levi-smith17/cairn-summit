import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getUserId } from '../../shared/auth'
import { s3, PRIVATE_MEDIA_BUCKET, PRESIGN_EXPIRES } from '../../shared/s3'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
])

function extFromContentType(contentType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png',
        'image/webp': 'webp', 'image/heic': 'heic',
    }
    return map[contentType] ?? 'jpg'
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')
        const { contentType, fileSize } = body

        if (!contentType) return toApiGatewayResponse(badRequest('contentType is required'))
        if (!ALLOWED_TYPES.has(contentType)) return toApiGatewayResponse(badRequest('Unsupported file type'))
        if (fileSize && fileSize > MAX_FILE_SIZE) return toApiGatewayResponse(badRequest('File too large (max 10 MB)'))

        const userId = getUserId(event)
        const key = `receipts/${userId}/${randomUUID()}.${extFromContentType(contentType)}`

        const url = await getSignedUrl(
            s3,
            new PutObjectCommand({ Bucket: PRIVATE_MEDIA_BUCKET, Key: key, ContentType: contentType }),
            { expiresIn: PRESIGN_EXPIRES },
        )

        return toApiGatewayResponse(ok({ url, key }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
