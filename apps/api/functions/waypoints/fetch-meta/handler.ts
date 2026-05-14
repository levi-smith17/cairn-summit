import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

function extractMeta(html: string, baseUrl: string): { title: string | null; favicon: string | null } {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null

    // Try <link rel="icon"> variants
    const iconPatterns = [
        /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i,
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i,
    ]
    let faviconPath: string | null = null
    for (const pattern of iconPatterns) {
        const match = html.match(pattern)
        if (match) { faviconPath = match[1]; break }
    }

    let favicon: string | null = null
    if (faviconPath) {
        try {
            favicon = new URL(faviconPath, baseUrl).href
        } catch {
            favicon = null
        }
    } else {
        // Fall back to /favicon.ico
        try {
            const origin = new URL(baseUrl).origin
            favicon = `${origin}/favicon.ico`
        } catch {
            favicon = null
        }
    }

    return { title, favicon }
}

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
    try {
        const url = event.queryStringParameters?.url
        if (!url) return toApiGatewayResponse(badRequest('url query parameter is required'))

        let parsed: URL
        try {
            parsed = new URL(url)
        } catch {
            return toApiGatewayResponse(badRequest('Invalid URL'))
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return toApiGatewayResponse(badRequest('Only http and https URLs are supported'))
        }

        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CairnBot/1.0)' },
            signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) {
            return toApiGatewayResponse(ok({ title: null, favicon: `${parsed.origin}/favicon.ico` }))
        }

        const contentType = res.headers.get('content-type') ?? ''
        if (!contentType.includes('text/html')) {
            return toApiGatewayResponse(ok({ title: null, favicon: `${parsed.origin}/favicon.ico` }))
        }

        // Read only the first 64KB to avoid loading huge pages
        const reader = res.body?.getReader()
        let html = ''
        if (reader) {
            const decoder = new TextDecoder()
            let bytesRead = 0
            while (bytesRead < 65536) {
                const { done, value } = await reader.read()
                if (done) break
                html += decoder.decode(value, { stream: true })
                bytesRead += value.byteLength
                if (html.includes('</head>')) break
            }
            reader.cancel()
        } else {
            html = await res.text()
        }

        const { title, favicon } = extractMeta(html, url)
        return toApiGatewayResponse(ok({ title, favicon }))
    } catch (err) {
        console.error(err)
        return toApiGatewayResponse(serverError())
    }
}
