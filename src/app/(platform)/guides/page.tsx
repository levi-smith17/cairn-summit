import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuidesClient } from './components/guides-client'

export default async function GuidesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id

  const [guides, trails, markers] = await Promise.all([
    prisma.guide.findMany({
      where: { wayfarerId },
      include: {
        trail: true,
        stones: {
          include: {
            markers: { include: { marker: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trail.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  return <GuidesClient guides={guides} trails={trails} markers={markers} />
}
