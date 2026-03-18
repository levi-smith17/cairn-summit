import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MarkersClient } from './components/markers-client'

export default async function MarkersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const markers = await prisma.marker.findMany({
    where: { wayfarerId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { waypoints: true } } },
  })

  return <MarkersClient markers={markers} />
}
