import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2Companions, R2_COMPANIONS_BUCKET } from '@/lib/r2-companions'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: keyParam } = await params

  // Find the media record and verify it belongs to a listed wayfarer
  const media = await prisma.companionMedia.findFirst({
    where: {
      key: { endsWith: keyParam },
      companion: {
        wayfarer: { listed: true },
      },
    },
  })

  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const response = await r2Companions.send(
    new GetObjectCommand({
      Bucket: R2_COMPANIONS_BUCKET,
      Key: media.key,
    })
  )

  const stream = response.Body as ReadableStream

  return new NextResponse(stream, {
    headers: {
      'Content-Type': response.ContentType ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}