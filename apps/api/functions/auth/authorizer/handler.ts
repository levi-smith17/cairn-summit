import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerResult,
} from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { hashApiToken, isApiToken, tokenLookupPk } from '../../shared/api-token'

const region = process.env.AWS_REGION ?? 'us-east-2'
const userPoolId = process.env.COGNITO_USER_POOL_ID
const clientId = process.env.COGNITO_CLIENT_ID

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1] ?? null
}

async function verifyJwt(token: string): Promise<{ sub: string; email?: string }> {
  if (!userPoolId || !clientId) {
    throw new Error('Cognito env vars missing')
  }

  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`),
    )
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
  const { payload } = await jwtVerify(token, jwks, {
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
    const token = parseBearerToken(event.headers?.authorization ?? event.headers?.Authorization)
    if (!token) {
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
    console.error('Authorizer failed', error)
    return { isAuthorized: false }
  }
}
