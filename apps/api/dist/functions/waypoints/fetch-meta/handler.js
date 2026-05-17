"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const response_1 = require("../../shared/response");
function extractMeta(html, baseUrl) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    // Try <link rel="icon"> variants
    const iconPatterns = [
        /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i,
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i,
    ];
    let faviconPath = null;
    for (const pattern of iconPatterns) {
        const match = html.match(pattern);
        if (match) {
            faviconPath = match[1];
            break;
        }
    }
    let favicon = null;
    if (faviconPath) {
        try {
            favicon = new URL(faviconPath, baseUrl).href;
        }
        catch {
            favicon = null;
        }
    }
    else {
        // Fall back to /favicon.ico
        try {
            const origin = new URL(baseUrl).origin;
            favicon = `${origin}/favicon.ico`;
        }
        catch {
            favicon = null;
        }
    }
    return { title, favicon };
}
const handler = async (event) => {
    try {
        const url = event.queryStringParameters?.url;
        if (!url)
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('url query parameter is required'));
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Invalid URL'));
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.badRequest)('Only http and https URLs are supported'));
        }
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CairnBot/1.0)' },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ title: null, favicon: `${parsed.origin}/favicon.ico` }));
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) {
            return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ title: null, favicon: `${parsed.origin}/favicon.ico` }));
        }
        // Read only the first 64KB to avoid loading huge pages
        const reader = res.body?.getReader();
        let html = '';
        if (reader) {
            const decoder = new TextDecoder();
            let bytesRead = 0;
            while (bytesRead < 65536) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                html += decoder.decode(value, { stream: true });
                bytesRead += value.byteLength;
                if (html.includes('</head>'))
                    break;
            }
            reader.cancel();
        }
        else {
            html = await res.text();
        }
        const { title, favicon } = extractMeta(html, url);
        return (0, response_1.toApiGatewayResponse)((0, response_1.ok)({ title, favicon }));
    }
    catch (err) {
        console.error(err);
        return (0, response_1.toApiGatewayResponse)((0, response_1.serverError)());
    }
};
exports.handler = handler;
//# sourceMappingURL=handler.js.map