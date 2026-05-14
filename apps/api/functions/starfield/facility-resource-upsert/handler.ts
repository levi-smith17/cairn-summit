import { BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const facilityId = event.pathParameters?.facilityId
        const resourceId = event.pathParameters?.resourceId

        if (!facilityId || !resourceId) {
            return toApiGatewayResponse(badRequest('Missing facilityId or resourceId'))
        }

        const body = JSON.parse(event.body ?? '{}')

        if (typeof body.onsite !== 'boolean') {
            return toApiGatewayResponse(badRequest('onsite is required and must be a boolean'))
        }

        // Step 1: Fetch the global resource to get name and abbreviation
        const resourceResult = await dynamo.send(new BatchGetCommand({
            RequestItems: {
                [TABLE_NAME]: {
                    Keys: [{ pk: 'SF#RESOURCE', sk: `RESOURCE#${resourceId}` }],
                },
            },
        }))

        const resourceItem = resourceResult.Responses?.[TABLE_NAME]?.[0]

        if (!resourceItem) {
            return toApiGatewayResponse(notFound('Resource not found'))
        }

        const pk = getPk(event)

        // Step 2: Upsert the resource entry on the facility
        await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: `SF#FACILITY#${facilityId}` },
            UpdateExpression: 'SET #resources.#rid = :value',
            ExpressionAttributeNames: {
                '#resources': 'resources',
                '#rid': resourceId,
            },
            ExpressionAttributeValues: {
                ':value': {
                    resourceId,
                    name: resourceItem.name,
                    abbreviation: resourceItem.abbreviation,
                    onsite: body.onsite,
                    fromFacilityId: body.fromFacilityId ?? null,
                    relay: body.relay ?? null,
                },
            },
        }))

        return toApiGatewayResponse(noContent())
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
