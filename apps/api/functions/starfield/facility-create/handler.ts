import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body ?? '{}')

        if (!body.networkId || !body.name || !body.abbreviation || !body.system || !body.planet) {
            return toApiGatewayResponse(badRequest('networkId, name, abbreviation, system, and planet are required'))
        }

        const pk = getPk(event)
        const id = randomUUID()
        const sk = `SF#FACILITY#${id}`

        const item = {
            pk,
            sk,
            networkId: body.networkId,
            name: body.name,
            abbreviation: body.abbreviation,
            system: body.system,
            planet: body.planet,
            parentId: body.parentId,
            depth: body.parentId ? 1 : 0,
            position: { x: 0, y: 0 },
            resources: {},
            transferStationLimit: body.transferStationLimit ?? 5,
            createdAt: new Date().toISOString(),
        }

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }))

        return toApiGatewayResponse(created({ ...item, resources: [] }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
