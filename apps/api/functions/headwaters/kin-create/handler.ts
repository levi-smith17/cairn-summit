import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { Kin } from '@cairn/types'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.givenName || !body.surname) {
            return toApiGatewayResponse(badRequest('givenName and surname are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const now = new Date().toISOString()

        const kin: Kin = {
            pk,
            sk: `KIN#${id}`,
            givenName: body.givenName,
            middleName: body.middleName,
            surname: body.surname,
            birthDate: body.birthDate,
            deathDate: body.deathDate,
            fatherId: body.fatherId,
            fatherUnknown: body.fatherUnknown ?? false,
            motherId: body.motherId,
            motherUnknown: body.motherUnknown ?? false,
            bloodlines: body.bloodlines ?? [],
            createdAt: now,
            updatedAt: now,
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: kin,
        }))

        return toApiGatewayResponse(created(kin))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
