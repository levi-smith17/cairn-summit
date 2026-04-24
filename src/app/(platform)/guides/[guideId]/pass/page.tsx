import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuidePassClient } from './components/guide-pass-client'

interface GuidePassPageProps {
  params: Promise<{ guideId: string }>
}

export default async function GuidePassPage({ params }: GuidePassPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const wayfarerId = session.user.id
  const { guideId } = await params

  const [guide, markers] = await Promise.all([
    prisma.guide.findFirst({
      where: { id: guideId, wayfarerId },
      include: {
        stones: {
          include: {
            markers: { include: { marker: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.marker.findMany({ where: { wayfarerId }, orderBy: { name: 'asc' } }),
  ])

  if (!guide) notFound()

  return (
    <GuidePassClient
      title={guide.name}
      stones={guide.stones}
      allMarkers={markers}
      backUrl={`/guides?guide=${guideId}`}
      guideIds={[guideId]}
    />
  )
}
