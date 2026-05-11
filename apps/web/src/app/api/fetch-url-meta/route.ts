import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch?.[1]?.trim() ?? new URL(url).hostname

    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    const faviconMatch = html.match(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*href="([^"]+)"/i)

    const { origin } = new URL(url)
    const favicon = ogImageMatch?.[1]
      ?? (faviconMatch?.[1]
        ? faviconMatch[1].startsWith('http') ? faviconMatch[1] : `${origin}${faviconMatch[1]}`
        : `${origin}/favicon.ico`)

    return NextResponse.json({ title, favicon })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL metadata' }, { status: 500 })
  }
}