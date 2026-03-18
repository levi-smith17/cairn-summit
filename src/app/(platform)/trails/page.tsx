import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TrailsClient } from './components/trails-client'

export default async function TrailsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const trails = await prisma.trail.findMany({
    where: { wayfarerId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { waypoints: true } } },
  })

  return <TrailsClient trails={trails} />
}
