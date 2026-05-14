import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../shared/s3', () => ({
    s3: { send: vi.fn() },
    PUBLIC_MEDIA_BUCKET: 'cairn-test-public-media',
}))

vi.mock('../../shared/auth', () => ({
    getUserId: () => 'test-user-id',
}))

vi.mock('../../shared/response', async () => {
    const actual = await vi.importActual<typeof import('../../shared/response')>('../../shared/response')
    return actual
})

import { s3 } from '../../shared/s3'
import { handler } from './handler'

const mockSend = s3.send as ReturnType<typeof vi.fn>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeEvent = (key?: string) => ({
    queryStringParameters: key ? { key } : {},
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'test-user-id' } } },
    },
})

function parseBody(result: any) {
    return JSON.parse(result.body)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
    it('returns 400 when key is missing', async () => {
        const result = await handler(makeEvent() as any)
        expect((result as any).statusCode).toBe(400)
        expect(parseBody(result).error).toMatch(/key is required/i)
    })

    it('returns 403 when key is not scoped to the user', async () => {
        const result = await handler(makeEvent('companions/other-user-id/photo.jpg') as any)
        expect((result as any).statusCode).toBe(403)
        expect(parseBody(result).error).toMatch(/access denied/i)
    })

    it('returns 403 when key attempts path traversal', async () => {
        const result = await handler(makeEvent('companions/../test-user-id/photo.jpg') as any)
        expect((result as any).statusCode).toBe(403)
    })

    it('returns 403 when key prefix matches but userId does not', async () => {
        const result = await handler(makeEvent('companions/test-user-id-evil/photo.jpg') as any)
        expect((result as any).statusCode).toBe(403)
    })
})

// ── Successful delete ─────────────────────────────────────────────────────────

describe('successful delete', () => {
    it('returns 204 on successful delete', async () => {
        mockSend.mockResolvedValueOnce({})
        const result = await handler(makeEvent('companions/test-user-id/photo.jpg') as any)
        expect((result as any).statusCode).toBe(204)
    })

    it('calls DeleteObjectCommand with correct bucket and key', async () => {
        mockSend.mockResolvedValueOnce({})
        await handler(makeEvent('companions/test-user-id/photo.jpg') as any)
        expect(mockSend).toHaveBeenCalledOnce()
        const command = mockSend.mock.calls[0][0]
        expect(command.input).toMatchObject({
            Bucket: 'cairn-test-public-media',
            Key: 'companions/test-user-id/photo.jpg',
        })
    })

    it('accepts nested key paths', async () => {
        mockSend.mockResolvedValueOnce({})
        const result = await handler(makeEvent('companions/test-user-id/2024/06/photo.jpg') as any)
        expect((result as any).statusCode).toBe(204)
    })

    it('accepts various image extensions', async () => {
        for (const ext of ['jpg', 'png', 'heic', 'webp']) {
            mockSend.mockResolvedValueOnce({})
            const result = await handler(makeEvent(`companions/test-user-id/photo.${ext}`) as any)
            expect((result as any).statusCode).toBe(204)
        }
    })

    it('accepts video extensions', async () => {
        for (const ext of ['mp4', 'mov', 'm4v', 'webm']) {
            mockSend.mockResolvedValueOnce({})
            const result = await handler(makeEvent(`companions/test-user-id/video.${ext}`) as any)
            expect((result as any).statusCode).toBe(204)
        }
    })
})

// ── Error handling ────────────────────────────────────────────────────────────

describe('error handling', () => {
    it('returns 500 when S3 throws', async () => {
        mockSend.mockRejectedValueOnce(new Error('S3 error'))
        const result = await handler(makeEvent('companions/test-user-id/photo.jpg') as any)
        expect((result as any).statusCode).toBe(500)
    })

    it('does not call S3 when validation fails', async () => {
        await handler(makeEvent() as any)
        expect(mockSend).not.toHaveBeenCalled()
    })

    it('does not call S3 when access is denied', async () => {
        await handler(makeEvent('companions/other-user/photo.jpg') as any)
        expect(mockSend).not.toHaveBeenCalled()
    })
})