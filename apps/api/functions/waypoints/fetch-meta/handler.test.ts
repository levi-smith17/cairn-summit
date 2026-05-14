import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../shared/response', async () => {
    const actual = await vi.importActual<typeof import('../../shared/response')>('../../shared/response')
    return actual
})

const mockFetch = vi.fn()
global.fetch = mockFetch

import { handler } from './handler'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEvent = (url?: string) => ({
    queryStringParameters: url ? { url } : {},
    requestContext: {
        authorizer: { jwt: { claims: { sub: 'test-user-id' } } },
    },
})

function makeHtmlResponse(html: string, contentType = 'text/html; charset=utf-8', ok = true) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(html)
    let offset = 0

    const stream = new ReadableStream({
        pull(controller) {
            if (offset >= bytes.length) {
                controller.close()
                return
            }
            const chunk = bytes.slice(offset, offset + 1024)
            offset += chunk.length
            controller.enqueue(chunk)
        },
    })

    return {
        ok,
        headers: { get: (key: string) => key === 'content-type' ? contentType : null },
        body: stream,
        text: async () => html,
    }
}

function parseBody(result: any) {
    return JSON.parse(result.body)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
    it('returns 400 when url param is missing', async () => {
        const result = await handler(makeEvent() as any)
        expect((result as any).statusCode).toBe(400)
        expect(parseBody(result).error).toMatch(/url query parameter is required/i)
    })

    it('returns 400 when url is not a valid URL', async () => {
        const result = await handler(makeEvent('not-a-url') as any)
        expect((result as any).statusCode).toBe(400)
        expect(parseBody(result).error).toMatch(/invalid url/i)
    })

    it('returns 400 for non-http protocols', async () => {
        const result = await handler(makeEvent('ftp://example.com/file') as any)
        expect((result as any).statusCode).toBe(400)
        expect(parseBody(result).error).toMatch(/only http and https/i)
    })

    it('accepts http URLs', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><title>Test</title></html>'))
        const result = await handler(makeEvent('http://example.com') as any)
        expect((result as any).statusCode).toBe(200)
    })

    it('accepts https URLs', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><title>Test</title></html>'))
        const result = await handler(makeEvent('https://example.com') as any)
        expect((result as any).statusCode).toBe(200)
    })
})

// ── Fetch behaviour ───────────────────────────────────────────────────────────

describe('fetch behaviour', () => {
    it('sends the CairnBot user-agent header', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><title>Test</title></html>'))
        await handler(makeEvent('https://example.com') as any)
        expect(mockFetch).toHaveBeenCalledWith(
            'https://example.com',
            expect.objectContaining({
                headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('CairnBot') }),
            })
        )
    })

    it('returns title null and fallback favicon when fetch response is not ok', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('', 'text/html', false))
        const result = await handler(makeEvent('https://example.com') as any)
        const { data } = parseBody(result)
        expect(data.title).toBeNull()
        expect(data.favicon).toBe('https://example.com/favicon.ico')
    })

    it('returns title null and fallback favicon for non-html content type', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('{"key":"value"}', 'application/json'))
        const result = await handler(makeEvent('https://example.com') as any)
        const { data } = parseBody(result)
        expect(data.title).toBeNull()
        expect(data.favicon).toBe('https://example.com/favicon.ico')
    })

    it('returns 500 when fetch throws', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))
        const result = await handler(makeEvent('https://example.com') as any)
        expect((result as any).statusCode).toBe(500)
    })

    it('returns 500 when fetch times out', async () => {
        mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))
        const result = await handler(makeEvent('https://example.com') as any)
        expect((result as any).statusCode).toBe(500)
    })
})

// ── Title extraction ──────────────────────────────────────────────────────────

describe('title extraction', () => {
    it('extracts a basic title tag', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head><title>Hello World</title></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBe('Hello World')
    })

    it('trims whitespace from title', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head><title>  Padded Title  </title></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBe('Padded Title')
    })

    it('returns null title when no title tag exists', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBeNull()
    })

    it('handles title tag with attributes', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head><title lang="en">Attributed</title></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBe('Attributed')
    })

    it('is case-insensitive for title tag', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head><TITLE>Uppercase</TITLE></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBe('Uppercase')
    })
})

// ── Favicon extraction ────────────────────────────────────────────────────────

describe('favicon extraction', () => {
    it('extracts rel="icon" href', async () => {
        const html = '<html><head><link rel="icon" href="/images/icon.png"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/images/icon.png')
    })

    it('extracts rel="shortcut icon" href', async () => {
        const html = '<html><head><link rel="shortcut icon" href="/favicon.png"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/favicon.png')
    })

    it('handles href-before-rel attribute order', async () => {
        const html = '<html><head><link href="/alt-icon.png" rel="icon"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/alt-icon.png')
    })

    it('resolves absolute favicon URLs as-is', async () => {
        const html = '<html><head><link rel="icon" href="https://cdn.example.com/icon.png"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://cdn.example.com/icon.png')
    })

    it('resolves relative favicon paths against the page URL', async () => {
        const html = '<html><head><link rel="icon" href="icon.png"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com/blog/post') as any))
        expect(data.favicon).toBe('https://example.com/blog/icon.png')
    })

    it('falls back to /favicon.ico when no icon link found', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head><title>No Icon</title></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/favicon.ico')
    })

    it('falls back to /favicon.ico on a non-standard port', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com:8080/page') as any))
        expect(data.favicon).toBe('https://example.com:8080/favicon.ico')
    })

    it('uses double-quoted href attribute', async () => {
        const html = '<html><head><link rel="icon" href="/dq-icon.png"></head></html>'
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/dq-icon.png')
    })

    it('uses single-quoted href attribute', async () => {
        const html = "<html><head><link rel='icon' href='/sq-icon.png'></head></html>"
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.favicon).toBe('https://example.com/sq-icon.png')
    })
})

// ── Combined output ───────────────────────────────────────────────────────────

describe('combined title and favicon', () => {
    it('returns both title and favicon when both are present', async () => {
        const html = `
            <html>
            <head>
                <title>My Page</title>
                <link rel="icon" href="/icon.svg">
            </head>
            </html>
        `
        mockFetch.mockResolvedValueOnce(makeHtmlResponse(html))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBe('My Page')
        expect(data.favicon).toBe('https://example.com/icon.svg')
    })

    it('returns null title with fallback favicon when page has neither', async () => {
        mockFetch.mockResolvedValueOnce(makeHtmlResponse('<html><head></head></html>'))
        const { data } = parseBody(await handler(makeEvent('https://example.com') as any))
        expect(data.title).toBeNull()
        expect(data.favicon).toBe('https://example.com/favicon.ico')
    })
})