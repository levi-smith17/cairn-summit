import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

export function getPathId(event: APIGatewayProxyEventV2): string | undefined {
    return event.pathParameters?.id
}

export function getUserId(
    event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer,
): string {
    const authorizer = (event.requestContext as {
        authorizer?: {
            lambda?: { sub?: string }
            jwt?: { claims?: { sub?: string } }
        }
    }).authorizer

    const lambdaSub = authorizer?.lambda?.sub
    if (typeof lambdaSub === 'string' && lambdaSub.length > 0) {
        return lambdaSub
    }

    const jwtSub = authorizer?.jwt?.claims?.sub
    if (typeof jwtSub === 'string' && jwtSub.length > 0) {
        return jwtSub
    }

    throw new Error('Unauthorized')
}

export function getPk(
    event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer,
): string {
    return `USER#${getUserId(event)}`
}
