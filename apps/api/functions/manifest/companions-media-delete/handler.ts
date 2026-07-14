import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getPk, getUserId } from '../../shared/auth'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { s3, PUBLIC_MEDIA_BUCKET } from '../../shared/s3'
import {
    toApiGatewayResponse,
    badRequest,
    forbidden,
    noContent,
    notFound,
    serverError,
} from '../../shared/response'

type MediaItem = {
    id: string
    key: string
    type?: string
    caption?: string | null
    order?: number
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const query = event.queryStringParameters ?? {}
        const companionId = query.companionId
        const mediaId = query.mediaId
        const keyParam = query.key
        const userId = getUserId(event)
        const pk = getPk(event)

        let key = keyParam
        let nextMedia: MediaItem[] | null = null

        if (companionId && mediaId) {
            const companion = await dynamo.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk: `COMPANION#${companionId}` },
                }),
            )
            if (!companion.Item) return toApiGatewayResponse(notFound('Companion not found'))

            const media = Array.isArray(companion.Item.media)
                ? (companion.Item.media as MediaItem[])
                : []
            const target = media.find((item) => item.id === mediaId)
            if (!target) return toApiGatewayResponse(notFound('Media not found'))
            key = target.key
            nextMedia = media
                .filter((item) => item.id !== mediaId)
                .map((item, index) => ({
                    ...item,
                    order: index,
                }))
        }

        if (!key) return toApiGatewayResponse(badRequest('key or companionId+mediaId is required'))

        if (!key.startsWith(`companions/${userId}/`)) {
            return toApiGatewayResponse(forbidden('Access denied'))
        }

        if (nextMedia && companionId) {
            await dynamo.send(
                new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { pk, sk: `COMPANION#${companionId}` },
                    UpdateExpression: 'SET #media = :media',
                    ExpressionAttributeNames: { '#media': 'media' },
                    ExpressionAttributeValues: { ':media': nextMedia },
                }),
            )
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: PUBLIC_MEDIA_BUCKET,
                Key: key,
            }),
        )

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
