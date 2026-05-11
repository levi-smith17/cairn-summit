import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Companions, R2_COMPANIONS_BUCKET } from '@/lib/r2-companions'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const wayfarerId = session.user.id

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const companionId = formData.get('companionId') as string | null
    const order = parseInt(formData.get('order') as string ?? '0')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!companionId) {
      return NextResponse.json({ error: 'No companionId provided' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const companion = await prisma.companion.findFirst({
      where: { id: companionId, wayfarerId },
    })
    if (!companion) {
      return NextResponse.json({ error: 'Companion not found' }, { status: 404 })
    }

    const isVideo = file.type.startsWith('video/')
    const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')
    const key = `companions/${wayfarerId}/${randomUUID()}.${ext}`
    const type = isVideo ? 'VIDEO' : 'IMAGE'

    const buffer = Buffer.from(await file.arrayBuffer())

    await r2Companions.send(
      new PutObjectCommand({
        Bucket: R2_COMPANIONS_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const media = await prisma.companionMedia.create({
      data: { companionId, key, type, order },
    })

    return NextResponse.json({ key, type, media })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}