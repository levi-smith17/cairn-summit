import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { s3, PUBLIC_MEDIA_BUCKET, PRESIGN_EXPIRES } from '../../shared/s3'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm',
])

function extFromContentType(contentType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic',
        'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    }
    return map[contentType] ?? 'bin'
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')
        const { companionId, contentType, fileSize, caption, order } = body

        if (!companionId) return toApiGatewayResponse(badRequest('companionId is required'))
        if (!contentType) return toApiGatewayResponse(badRequest('contentType is required'))
        if (!ALLOWED_TYPES.has(contentType)) return toApiGatewayResponse(badRequest('Unsupported file type'))
        if (fileSize && fileSize > MAX_FILE_SIZE) return toApiGatewayResponse(badRequest('File too large (max 100 MB)'))

        const pk = getPk(event)

        const companion = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `COMPANION#${companionId}` },
        }))
        if (!companion.Item) return toApiGatewayResponse(notFound('Companion not found'))

        const mediaId = randomUUID()
        const userId = pk.replace('USER#', '')
        const ext = extFromContentType(contentType)
        const key = `companions/${userId}/${mediaId}.${ext}`
        const type = contentType.startsWith('video/') ? 'VIDEO' : 'IMAGE'
        const mediaOrder = typeof order === 'number' ? order : 0

        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `COMPANION#${companionId}` },
            UpdateExpression: 'SET #media = list_append(if_not_exists(#media, :empty), :newMedia)',
            ExpressionAttributeNames: { '#media': 'media' },
            ExpressionAttributeValues: {
                ':empty': [],
                ':newMedia': [{ id: mediaId, key, type, caption: caption ?? null, order: mediaOrder }],
            },
        }))

        const presignedUrl = await getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: PUBLIC_MEDIA_BUCKET,
                Key: key,
                ContentType: contentType,
            }),
            { expiresIn: PRESIGN_EXPIRES },
        )

        return toApiGatewayResponse(ok({ url: presignedUrl, key, mediaId, type }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
