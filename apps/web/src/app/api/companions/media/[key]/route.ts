import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2Companions, R2_COMPANIONS_BUCKET } from '@/lib/r2-companions'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: keyParam } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = `companions/${session.user.id}/${keyParam}`

  const media = await prisma.companionMedia.findFirst({
    where: {
      key,
      companion: { wayfarerId: session.user.id },
    },
  })

  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const response = await r2Companions.send(
    new GetObjectCommand({ Bucket: R2_COMPANIONS_BUCKET, Key: key })
  )

  const stream = response.Body as ReadableStream

  return new NextResponse(stream, {
    headers: {
      'Content-Type': response.ContentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}