import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params
  // Reconstruct the full R2 key — scoped to the requesting user
  const r2Key = `logs/${session.user.id}/${key}`

  try {
    const response = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key })
    )
    const stream = response.Body as ReadableStream

    return new NextResponse(stream, {
      headers: {
        'Content-Type': response.ContentType ?? 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
