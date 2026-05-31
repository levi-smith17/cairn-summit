import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const pk = getPk(event)

        const result = await dynamo.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':prefix': 'SF#FACILITY#',
            },
        }))

        const items = (result.Items ?? []).map(item => ({
            ...item,
            resources: Object.values(item.resources ?? {}).map((r: any) => {
                const fromOutpostId = r.fromOutpostId ?? r.fromFacilityId ?? null
                let supplies = r.supplies
                if (!supplies?.length && (r.fromPlanet || fromOutpostId)) {
                    supplies = [{
                        fromOutpostId,
                        fromPlanet: r.fromPlanet ?? null,
                        fromSystem: r.fromSystem ?? null,
                        relay: r.relay ?? null,
                    }]
                } else if (!supplies?.length) {
                    supplies = []
                }
                supplies = supplies.map((s: any) => ({
                    fromOutpostId: s.fromOutpostId ?? null,
                    fromPlanet: s.fromPlanet ?? null,
                    fromSystem: s.fromSystem ?? null,
                    relay: s.relay ?? null,
                }))
                return {
                    resourceId: r.resourceId,
                    name: r.name,
                    abbreviation: r.abbreviation,
                    onsite: r.onsite,
                    origin: r.origin ?? false,
                    supplies,
                }
            }),
        }))

        return toApiGatewayResponse(ok(items))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
