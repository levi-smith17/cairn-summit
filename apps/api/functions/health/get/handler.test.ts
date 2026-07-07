import { describe, expect, it } from 'vitest'
import { handler } from './handler'

describe('health/get', () => {
  it('returns ok payload', async () => {
    process.env.ENVIRONMENT = 'dev'
    const response = await handler({} as never)
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body ?? '{}')
    expect(body.data.status).toBe('ok')
    expect(body.data.environment).toBe('dev')
  })
})
