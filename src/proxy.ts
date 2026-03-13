import { NextRequest, NextResponse } from 'next/server'

// The canonical app URL — used to call internal APIs from middleware.
// Set APP_URL=https://cairn.ing in production, http://localhost:3000 in development.
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

// Hostnames that should never be treated as custom domains
const MAIN_HOSTS = new Set([
  'cairn.ing',
  'www.cairn.ing',
  'localhost',
  '127.0.0.1',
])

function isMainHost(host: string) {
  // Strip port number
  const bare = host.split(':')[0]
  return (
    MAIN_HOSTS.has(bare) ||
    bare.endsWith('.vercel.app') ||
    bare.endsWith('.localhost')
  )
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? ''

  // Pass through if this is the main app domain
  if (isMainHost(host)) return NextResponse.next()

  // Custom domain request — look up the username
  try {
    const lookupRes = await fetch(
      `${APP_URL}/api/domain-lookup?host=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } }
    )

    if (lookupRes.ok) {
      const { username } = await lookupRes.json()
      if (username) {
        const url = req.nextUrl.clone()
        const path = req.nextUrl.pathname
        // Rewrite to /manifest/[username], preserving any sub-path
        url.pathname = `/manifest/${username}${path === '/' ? '' : path}`
        return NextResponse.rewrite(url)
      }
    }
  } catch {
    // Domain not found or network error — fall through to 404
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/domain-lookup (prevents proxy from calling itself)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/domain-lookup).*)',
  ],
}
