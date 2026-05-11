import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

export function getPathId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string | undefined {
    return event.pathParameters?.id
}

export function getPk(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
    return `USER#${getUserId(event)}`
}

export function getUserId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
    return event.requestContext.authorizer.jwt.claims.sub as string
}