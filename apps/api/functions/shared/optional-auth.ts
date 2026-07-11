import { GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from './db'

const region = process.env.AWS_REGION ?? 'us-east-2'
const userPoolId = process.env.COGNITO_USER_POOL_ID
const clientId = process.env.COGNITO_CLIENT_ID

type JoseModule = typeof import('jose')
type JoseJwks = ReturnType<JoseModule['createRemoteJWKSet']>

let josePromise: Promise<JoseModule> | null = null
let jwks: JoseJwks | null = null

async function loadJose(): Promise<JoseModule> {
    if (!josePromise) {
        josePromise = new Function('return import("jose")')() as Promise<JoseModule>
    }
    return josePromise
}

function parseBearerToken(header: string | undefined): string | null {
    if (!header) return null
    const trimmed = header.trim()
    const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed)
    if (bearerMatch?.[1]) return bearerMatch[1]
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
        return trimmed
    }
    return null
}

function getAuthorizerSub(event: APIGatewayProxyEventV2): string | null {
    const authorizer = (event.requestContext as {
        authorizer?: {
            lambda?: { sub?: string }
            jwt?: { claims?: { sub?: string } }
            sub?: string
        }
    }).authorizer

    const lambdaSub = authorizer?.lambda?.sub
    if (typeof lambdaSub === 'string' && lambdaSub.length > 0) return lambdaSub

    const flatSub = authorizer?.sub
    if (typeof flatSub === 'string' && flatSub.length > 0) return flatSub

    const jwtSub = authorizer?.jwt?.claims?.sub
    if (typeof jwtSub === 'string' && jwtSub.length > 0) return jwtSub

    return null
}

async function verifyJwtSub(token: string): Promise<string | null> {
    if (!userPoolId || !clientId) return null

    try {
        const jose = await loadJose()
        if (!jwks) {
            jwks = jose.createRemoteJWKSet(
                new URL(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`),
            )
        }

        const { payload } = await jose.jwtVerify(token, jwks, {
            issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
            audience: clientId,
        })

        return typeof payload.sub === 'string' ? payload.sub : null
    } catch {
        return null
    }
}

/** Best-effort caller id for public routes (authorization_type NONE). */
export async function getOptionalUserId(event: APIGatewayProxyEventV2): Promise<string | null> {
    const fromAuthorizer = getAuthorizerSub(event)
    if (fromAuthorizer) return fromAuthorizer

    const token = parseBearerToken(event.headers?.authorization ?? event.headers?.Authorization)
    if (!token) return null

    return verifyJwtSub(token)
}

export async function isUserAdmin(userId: string): Promise<boolean> {
    const result = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
    }))
    return Boolean(result.Item?.isAdmin)
}

export async function resolveRequesterAccess(event: APIGatewayProxyEventV2): Promise<{
    userId: string | null
    isAdmin: boolean
}> {
    const userId = await getOptionalUserId(event)
    if (!userId) return { userId: null, isAdmin: false }
    const isAdmin = await isUserAdmin(userId)
    return { userId, isAdmin }
}
