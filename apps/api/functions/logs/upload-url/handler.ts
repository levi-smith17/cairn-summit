import { PutObjectCommand } from '@aws-sdk/client-s3'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getUserId, getPk } from '../../shared/auth'
import { s3, PRIVATE_MEDIA_BUCKET, PRESIGN_EXPIRES } from '../../shared/s3'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
])

function extFromContentType(contentType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png':  'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
    }
    return map[contentType] ?? 'jpg'
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')
        const { contentType, fileSize, logId } = body

        if (!contentType) return toApiGatewayResponse(badRequest('contentType is required'))
        if (!logId) return toApiGatewayResponse(badRequest('logId is required'))
        if (!ALLOWED_TYPES.has(contentType)) return toApiGatewayResponse(badRequest('Unsupported file type'))
        if (fileSize && fileSize > MAX_FILE_SIZE) return toApiGatewayResponse(badRequest('File too large (max 10 MB)'))

        const userId = getUserId(event)
        const pk = getPk(event)
        const filename = `${randomUUID()}.${extFromContentType(contentType)}`
        const key = `logs/${userId}/${filename}`

        // Register the key on the log record first so S3 objects are
        // always tracked — an unuploaded key is harmless, an untracked
        // S3 object is an orphan that can never be cleaned up
        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `LOG#${logId}` },
            UpdateExpression: 'SET mediaKeys = list_append(if_not_exists(mediaKeys, :empty), :newKey), updatedAt = :now',
            ExpressionAttributeValues: {
                ':newKey': [key],
                ':empty':  [],
                ':now':    new Date().toISOString(),
            },
        }))

        const url = await getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: PRIVATE_MEDIA_BUCKET,
                Key: key,
                ContentType: contentType,
            }),
            { expiresIn: PRESIGN_EXPIRES },
        )

        return toApiGatewayResponse(ok({ url, key }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}