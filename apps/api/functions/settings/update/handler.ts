import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const SETTINGS_SECTIONS = ['appearance', 'notifications', 'privacy', 'itinerary', 'waypoints', 'logs', 'signals'] as const
type SettingsSection = typeof SETTINGS_SECTIONS[number]

const ACCOUNT_FIELDS = ['name', 'email', 'image', 'username', 'timeFormat', 'listed', 'defaultTerminology', 'defaultTheme', 'headline', 'summary', 'location', 'linkedin', 'github', 'customDomain'] as const

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const section = event.pathParameters?.section

        if (!section) return toApiGatewayResponse(badRequest('Missing section'))

        const body = JSON.parse(event.body ?? '{}')
        const pk = getPk(event)

        if (section === 'account') {
            const setExprs: string[] = []
            const exprNames: Record<string, string> = {}
            const exprValues: Record<string, unknown> = {}

            for (const field of ACCOUNT_FIELDS) {
                if (field in body) {
                    const placeholder = `:${field}`
                    const nameKey = `#${field}`
                    setExprs.push(`${nameKey} = ${placeholder}`)
                    exprNames[nameKey] = field
                    exprValues[placeholder] = body[field]
                }
            }

            if (setExprs.length === 0) return toApiGatewayResponse(badRequest('No valid account fields provided'))

            const result = await dynamo.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { pk, sk: 'PROFILE' },
                UpdateExpression: `SET ${setExprs.join(', ')}`,
                ExpressionAttributeNames: exprNames,
                ExpressionAttributeValues: exprValues,
                ReturnValues: 'ALL_NEW',
            }))

            return toApiGatewayResponse(ok(result.Attributes))
        }

        if (!SETTINGS_SECTIONS.includes(section as SettingsSection)) {
            return toApiGatewayResponse(badRequest(`Invalid section: ${section}`))
        }

        const result = await dynamo.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'SETTINGS' },
            UpdateExpression: 'SET #section = :data',
            ExpressionAttributeNames: { '#section': section },
            ExpressionAttributeValues: { ':data': body },
            ReturnValues: 'ALL_NEW',
        }))

        return toApiGatewayResponse(ok(result.Attributes?.[section]))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
