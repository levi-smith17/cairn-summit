import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host')
  if (!host) return NextResponse.json({ username: null })

  const wayfarer = await prisma.wayfarer.findFirst({
    where: { customDomain: host },
    select: { username: true },
  })

  return NextResponse.json(
    { username: wayfarer?.username ?? null },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
