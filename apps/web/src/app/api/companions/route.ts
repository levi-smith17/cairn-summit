import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companions = await prisma.companion.findMany({
    where: { wayfarerId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: { media: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ companions })
}