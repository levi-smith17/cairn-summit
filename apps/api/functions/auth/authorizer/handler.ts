import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerResult,
} from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { hashApiToken, isApiToken, tokenLookupPk } from '../../shared/api-token'

const region = process.env.AWS_REGION ?? 'us-east-2'
const userPoolId = process.env.COGNITO_USER_POOL_ID
const clientId = process.env.COGNITO_CLIENT_ID

type JoseModule = typeof import('jose')
type JoseJwks = ReturnType<JoseModule['createRemoteJWKSet']>

let josePromise: Promise<JoseModule> | null = null
let jwks: JoseJwks | null = null

async function loadJose(): Promise<JoseModule> {
  if (!josePromise) {
    // tsc downlevels `import('jose')` to require() under CommonJS; use native import instead.
    josePromise = new Function('return import("jose")')() as Promise<JoseModule>
  }
  return josePromise
}

function extractBearerToken(event: APIGatewayRequestAuthorizerEventV2): string | null {
  const fromHeader = parseBearerToken(
    event.headers?.authorization ?? event.headers?.Authorization,
  )
  if (fromHeader) return fromHeader

  for (const source of event.identitySource ?? []) {
    const fromSource = parseBearerToken(source)
    if (fromSource) return fromSource
  }

  return null
}

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const trimmed = header.trim()
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed)
  if (bearerMatch?.[1]) return bearerMatch[1]
  // Cairn web sends Cognito ID tokens directly in Authorization (no Bearer prefix).
  // The old API Gateway JWT authorizer accepted this format.
  if (/^csk_/.test(trimmed) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
    return trimmed
  }
  return null
}

async function verifyJwt(token: string): Promise<{ sub: string; email?: string }> {
  if (!userPoolId || !clientId) {
    throw new Error('Cognito env vars missing')
  }

  const jose = await loadJose()

  if (!jwks) {
    jwks = jose.createRemoteJWKSet(
      new URL(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`),
    )
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer,
    audience: clientId,
  })

  const sub = typeof payload.sub === 'string' ? payload.sub : null
  if (!sub) throw new Error('Missing sub claim')

  return {
    sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  }
}

async function verifyApiToken(token: string): Promise<{ sub: string }> {
  const lookup = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: tokenLookupPk(token),
        sk: 'META',
      },
    }),
  )

  const userId = lookup.Item?.userId
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Invalid API token')
  }

  const tokenHash = hashApiToken(token)
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: 'API_TOKEN',
      },
      UpdateExpression: 'SET lastUsedAt = :lastUsedAt',
      ConditionExpression: 'tokenHash = :tokenHash',
      ExpressionAttributeValues: {
        ':lastUsedAt': new Date().toISOString(),
        ':tokenHash': tokenHash,
      },
    }),
  ).catch(() => {
    // Ignore races or missing user record — lookup already validated token existence.
  })

  return { sub: userId }
}

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerResult> => {
  try {
    const token = extractBearerToken(event)
    if (!token) {
      console.warn('Authorizer denied: missing bearer token')
      return { isAuthorized: false }
    }

    if (isApiToken(token)) {
      const user = await verifyApiToken(token)
      return {
        isAuthorized: true,
        context: {
          sub: user.sub,
          authType: 'api_token',
        },
      } as APIGatewaySimpleAuthorizerResult
    }

    const user = await verifyJwt(token)
    return {
      isAuthorized: true,
      context: {
        sub: user.sub,
        email: user.email ?? '',
        authType: 'jwt',
      },
    } as APIGatewaySimpleAuthorizerResult
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Authorizer failed', message)
    return { isAuthorized: false }
  }
}
