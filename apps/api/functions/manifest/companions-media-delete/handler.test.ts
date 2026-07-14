import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../shared/db', () => ({
    dynamo: { send: vi.fn().mockResolvedValue({}) },
    TABLE_NAME: 'cairn-test',
}))

vi.mock('../../shared/s3', () => ({
    s3: { send: vi.fn() },
    PUBLIC_MEDIA_BUCKET: 'cairn-test-public-media',
}))

vi.mock('../../shared/auth', () => ({
    getUserId: () => 'test-user-id',
    getPk: () => 'USER#test-user-id',
}))

vi.mock('../../shared/response', async () => {
    const actual = await vi.importActual<typeof import('../../shared/response')>(
        '../../shared/response',
    )
    return actual
})

import { s3 } from '../../shared/s3'
import { dynamo } from '../../shared/db'
import { handler } from './handler'

const mockS3Send = s3.send as ReturnType<typeof vi.fn>
const mockDynamoSend = dynamo.send as ReturnType<typeof vi.fn>

const makeEvent = (params: Record<string, string> = {}) => ({
    queryStringParameters: params,
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'test-user-id' } } },
    },
})

function parseBody(result: any) {
    return JSON.parse(result.body)
}

beforeEach(() => vi.clearAllMocks())

describe('input validation', () => {
    it('returns 400 when key and companionId/mediaId are missing', async () => {
        const result = await handler(makeEvent() as any)
        expect((result as any).statusCode).toBe(400)
        expect(parseBody(result).error).toMatch(/key or companionId/i)
    })

    it('returns 403 when key is not scoped to the user', async () => {
        const result = await handler(
            makeEvent({ key: 'companions/other-user-id/photo.jpg' }) as any,
        )
        expect((result as any).statusCode).toBe(403)
        expect(parseBody(result).error).toMatch(/access denied/i)
    })
})

describe('successful delete', () => {
    it('returns 204 on successful key delete', async () => {
        mockS3Send.mockResolvedValueOnce({})
        const result = await handler(
            makeEvent({ key: 'companions/test-user-id/photo.jpg' }) as any,
        )
        expect((result as any).statusCode).toBe(204)
    })

    it('removes media from DynamoDB when companionId and mediaId are provided', async () => {
        mockDynamoSend
            .mockResolvedValueOnce({
                Item: {
                    media: [
                        { id: 'm1', key: 'companions/test-user-id/a.jpg', type: 'IMAGE', order: 0 },
                        { id: 'm2', key: 'companions/test-user-id/b.jpg', type: 'IMAGE', order: 1 },
                    ],
                },
            })
            .mockResolvedValueOnce({})
        mockS3Send.mockResolvedValueOnce({})

        const result = await handler(makeEvent({ companionId: 'c1', mediaId: 'm1' }) as any)
        expect((result as any).statusCode).toBe(204)
        expect(mockDynamoSend).toHaveBeenCalledTimes(2)
        expect(mockS3Send).toHaveBeenCalledOnce()
    })
})

describe('error handling', () => {
    it('returns 500 when S3 throws', async () => {
        mockS3Send.mockRejectedValueOnce(new Error('S3 error'))
        const result = await handler(
            makeEvent({ key: 'companions/test-user-id/photo.jpg' }) as any,
        )
        expect((result as any).statusCode).toBe(500)
    })
})
