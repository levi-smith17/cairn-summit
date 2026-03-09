import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reconstruct the full key from the path segments
  const key = `receipts/${session.user.id}/${params.key}`

  // Verify the receipt belongs to this user
  const expense = await prisma.expense.findFirst({
    where: {
      wayfarerId: session.user.id,
      receiptUrl: key,
    },
  })

  if (!expense) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  const response = await r2.send(command)
  const stream = response.Body as ReadableStream

  return new NextResponse(stream, {
    headers: {
      'Content-Type': response.ContentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = `receipts/${session.user.id}/${params.key}`

  const expense = await prisma.expense.findFirst({
    where: {
      wayfarerId: session.user.id,
      receiptUrl: key,
    },
  })

  if (!expense) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))

  return NextResponse.json({ success: true })
}