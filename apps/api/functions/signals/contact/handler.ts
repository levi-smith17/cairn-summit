import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Signal } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { toApiGatewayResponse, created, badRequest, notFound, serverError } from '../../shared/response'

const TOKEN_TTL_DAYS = 7

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const username = event.pathParameters?.username
        if (!username) return toApiGatewayResponse(badRequest('Missing username'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.senderName || !body.senderEmail || !body.body) {
            return toApiGatewayResponse(badRequest('senderName, senderEmail, and body are required'))
        }

        // Find user by username — scan is acceptable for this low-frequency public endpoint
        const scan = await dynamo.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: 'sk = :sk AND username = :username',
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
                ':username': username,
            },
        }))

        const profile = scan.Items?.[0]
        if (!profile) return toApiGatewayResponse(notFound('User not found'))

        const userPk = profile.pk as string
        const id = randomUUID()
        const sk = `SIGNAL#${id}`
        const token = randomUUID()
        const now = new Date().toISOString()

        const tokenExpiresAt = new Date(
            Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
        ).toISOString()

        const signal: Signal = {
            pk: userPk,
            sk,
            senderName: body.senderName,
            senderEmail: body.senderEmail,
            body: body.body,
            read: false,
            token,
            tokenExpiresAt,
            createdAt: now,
        }

        // Store signal + a token lookup item in parallel
        await Promise.all([
            dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: signal })),
            dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    pk: 'TOKEN',
                    sk: token,
                    userPk,
                    signalId: id,
                    tokenExpiresAt,
                },
            })),
        ])

        return toApiGatewayResponse(created({ id }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
