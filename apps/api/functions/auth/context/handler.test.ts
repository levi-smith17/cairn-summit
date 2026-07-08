import { describe, it, expect } from 'vitest'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { handler } from './handler'

const mockEvent = (sub: string): APIGatewayProxyEventV2WithJWTAuthorizer => ({
  requestContext: {
    authorizer: {
      jwt: { claims: { sub }, scopes: [] },
      principalId: '',
      integrationLatency: 0,
    },
    accountId: '',
    apiId: '',
    domainName: '',
    domainPrefix: '',
    http: {
      method: 'GET',
      path: '/auth/context',
      protocol: 'HTTP/1.1',
      sourceIp: '',
      userAgent: '',
    },
    requestId: '',
    routeKey: 'GET /auth/context',
    stage: 'dev',
    time: '',
    timeEpoch: 0,
  },
  version: '2.0',
  routeKey: 'GET /auth/context',
  rawPath: '/auth/context',
  rawQueryString: '',
  headers: {},
  isBase64Encoded: false,
})

describe('auth/context handler', () => {
  it('returns the authenticated user id', async () => {
    const result = await handler(mockEvent('user-abc')) as { statusCode: number; body: string }
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).data.userId).toBe('user-abc')
  })
})
