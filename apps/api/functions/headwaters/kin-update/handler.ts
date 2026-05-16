import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Kin } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = getPathId(event)
        if (!id) return toApiGatewayResponse(badRequest('Missing kin id'))

        const body = JSON.parse(event.body ?? '{}')
        if (!body.givenName || !body.surname) {
            return toApiGatewayResponse(badRequest('givenName and surname are required'))
        }

        const pk = getPk(event)
        const now = new Date().toISOString()

        const setExpressions = [
            'givenName = :givenName',
            'surname = :surname',
            'fatherUnknown = :fatherUnknown',
            'motherUnknown = :motherUnknown',
            'bloodlines = :bloodlines',
            'updatedAt = :updatedAt',
        ]
        const removeExpressions: string[] = []
        const expressionValues: Record<string, unknown> = {
            ':givenName': body.givenName,
            ':surname': body.surname,
            ':fatherUnknown': body.fatherUnknown ?? false,
            ':motherUnknown': body.motherUnknown ?? false,
            ':bloodlines': body.bloodlines ?? [],
            ':updatedAt': now,
        }

        const optionalFields = ['middleName', 'nickname', 'maidenName', 'birthDate', 'deathDate', 'fatherId', 'motherId'] as const
        for (const field of optionalFields) {
            if (body[field] !== undefined) {
                setExpressions.push(`${field} = :${field}`)
                expressionValues[`:${field}`] = body[field]
            } else {
                removeExpressions.push(field)
            }
        }

        if (body.isSelf === true) {
            setExpressions.push('isSelf = :isSelf')
            expressionValues[':isSelf'] = true
        }

        let updateExpression = `SET ${setExpressions.join(', ')}`
        if (removeExpressions.length > 0) {
            updateExpression += ` REMOVE ${removeExpressions.join(', ')}`
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `KIN#${id}` },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes as Kin))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
